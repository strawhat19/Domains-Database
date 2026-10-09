import { Platform } from 'react-native';
import { FirebaseError } from 'firebase/app';
import { User } from '../models/users/User';
import { genID, isAppCollectionID } from '../common/ids';
import { clearAccountData } from '../accountData/service';
import { Roles, Types, Providers } from '../../types/types';
import { getFirebaseAuth, getFirebaseDb } from '../firebase/client';
import type { ProfileInput, PublicProfile } from '../models/users/User';
import type { SignInInput, SignUpInput, AuthenticationResult } from './types';
import { AccountDeactivatedError, AccountDataCleanupError, type AccountAction } from './types';
import { doc, getDocs, collection, updateDoc, runTransaction } from 'firebase/firestore';
import { signOut as firebaseSignOut, onIdTokenChanged, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile as updateFirebaseProfile, type User as FirebaseUser } from 'firebase/auth';

const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000;
let pendingAuthentication: Promise<AuthenticationResult> | null = null;
const avatarColors = [`#138b8b`, `#725d85`, `#966942`, `#416f9d`, `#957467`, `#59774c`];
const normalizeEmail = (value: string) => {
  const email = value?.trim()?.toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error(`Enter A Valid Email Address`);
  return email;
};
const validatePassword = (password: string) => {
  if (typeof password !== `string` || !password) throw new Error(`Enter A Password`);
};
const friendlyError = (failure: unknown): Error => {
  if (!(failure instanceof FirebaseError)) return failure instanceof Error ? failure : new Error(`Authentication Is Unavailable`);
  const messages: Record<string, string> = {
    [`auth/popup-blocked`]: `Allow Popups To Sign In With Google`,
    [`auth/popup-closed-by-user`]: `Google Sign In Was Cancelled`,
    [`auth/cancelled-popup-request`]: `Google Sign In Was Cancelled`,
    [`auth/weak-password`]: `Use A Password Of At Least 6 Characters`,
    [`auth/too-many-requests`]: `Too Many Attempts — Try Again Later`,
    [`auth/email-already-in-use`]: `An Account Already Uses This Email`,
    [`auth/user-disabled`]: `This Account Has Been Disabled`,
    [`auth/network-request-failed`]: `Check Your Internet Connection`,
    [`auth/operation-not-allowed`]: `Enable This Sign In Provider In Firebase`,
    [`auth/unauthorized-domain`]: `Add This Domain To Firebase Authentication`,
    [`auth/account-exists-with-different-credential`]: `Sign In With The Provider Already Linked To This Email`,
    [`auth/invalid-credential`]: `Email Or Password Is Incorrect`,
    [`auth/wrong-password`]: `Email Or Password Is Incorrect`,
    [`auth/user-not-found`]: `Email Or Password Is Incorrect`,
    [`permission-denied`]: `Your Account Does Not Have Permission To Access This Data`,
    [`unavailable`]: `Firebase Is Unavailable — Try Again Later`,
  };
  return new Error(messages[failure.code] || `Firebase Could Not Complete This Request (${failure.code})`);
};
const runOperation = async <T,>(operation: () => Promise<T>): Promise<T> => {
  try { return await operation(); } catch (failure) { throw friendlyError(failure); }
};
const runAuthentication = (operation: () => Promise<AuthenticationResult>): Promise<AuthenticationResult> => {
  if (pendingAuthentication) return Promise.reject(new Error(`A Sign In Is Already In Progress`));
  const result = runOperation(operation);
  pendingAuthentication = result;
  const finish = () => { if (pendingAuthentication === result) pendingAuthentication = null; };
  void result.then(finish, finish);
  return result;
};
const readUser = (record: Record<string, unknown>, authUser: FirebaseUser) => {
  if (!isAppCollectionID(record.id, Types.User) || !Number.isSafeInteger(record.number) || Number(record.number) < 1
    || record.uid !== authUser.uid || record.firebase_uid !== authUser.uid || !Object.values(Roles).includes(record.role as Roles)) {
    throw new Error(`Saved Firebase Account Data Is Incomplete`);
  }
  const photoURL = authUser.photoURL || authUser.providerData?.find(provider => provider.providerId === `google.com`)?.photoURL;
  return new User({ ...record, signedIn: true, ...(photoURL ? { photoURL, avatar: photoURL, imageURL: photoURL, image: photoURL } : {}) });
};
const sessionResult = (user: User): AuthenticationResult => ({ user, claimLegacy: false, expiresAt: Date.now() + SESSION_DURATION });

const ensureUser = async (authUser: FirebaseUser): Promise<{ user: User; newAccount: boolean }> => {
  if (getFirebaseAuth().currentUser?.uid !== authUser.uid) throw new Error(`Sign In To Access Your Saved Data`);
  const database = getFirebaseDb();
  const now = new Date();
  const name = (authUser.displayName?.trim()?.replace(/\s+/g, ` `) || authUser.email?.split(`@`)?.[0] || `Account`).slice(0, 100);
  const identityRef = doc(database, `identities`, authUser.uid);
  const counterRef = doc(database, `counters`, `users`);
  return runTransaction(database, async transaction => {
    const identity = await transaction.get(identityRef);
    if (identity.exists()) {
      const binding = identity.data();
      if (typeof binding.id !== `string` || binding.firebase_uid !== authUser.uid) throw new Error(`Saved Firebase Identity Is Incomplete`);
      const saved = await transaction.get(doc(database, `users`, binding.id));
      if (!saved.exists()) throw new Error(`Saved Firebase Account Could Not Be Found`);
      const user = readUser(saved.data(), authUser);
      if (user.id !== binding.id || user.number !== binding.number) throw new Error(`Saved Firebase Identity Does Not Match Your Account`);
      return { user, newAccount: false };
    }
    const counter = await transaction.get(counterRef);
    const previous = counter.exists() ? counter.data().number : 0;
    if (!Number.isSafeInteger(previous) || previous < 0) throw new Error(`Saved User Counter Is Invalid`);
    const number = previous + 1;
    const identityData = genID(Types.User, number, name, now);
    const color = avatarColors[(number - 1) % avatarColors.length]!;
    const providerId = authUser.providerData?.[0]?.providerId || `firebase`;
    const user = new User({
      name,
      number,
      plan: `free`,
      active: true,
      signedIn: false,
      id: identityData.id,
      uid: authUser.uid,
      uuid: identityData.uuid,
      email: authUser.email || ``,
      role: Roles.Subscriber,
      roles: [Roles.Subscriber],
      providerId,
      firebase_uid: authUser.uid,
      photoURL: authUser.photoURL || undefined,
      created: now.toISOString(),
      updated: now.toISOString(),
      lastSignIn: now.toISOString(),
      emailVerified: authUser.emailVerified,
      provider: providerId === `google.com` ? Providers.Google : Providers.Firebase,
      color: { color, type: `dark`, name: `User ${number}` },
    });
    transaction.set(counterRef, { number });
    transaction.set(doc(database, `users`, user.id), user.toRecord());
    transaction.set(identityRef, { id: user.id, number, firebase_uid: authUser.uid });
    return { newAccount: true, user: new User({ ...user, signedIn: true }) };
  });
};

const beginSession = async (authUser: FirebaseUser): Promise<AuthenticationResult> => {
  const account = await ensureUser(authUser);
  let user = account.user;
  if (!user.active) throw new AccountDeactivatedError();
  const now = new Date().toISOString();
  const changes = {
    updated: now,
    lastUpdated: now,
    lastSignIn: now,
    verified: authUser.emailVerified,
    emailVerified: authUser.emailVerified,
    lastSignInTime: authUser.metadata.lastSignInTime || now,
  };
  await updateDoc(doc(getFirebaseDb(), `users`, user.id), changes);
  user = new User({ ...user, ...changes, signedIn: true });
  return { ...sessionResult(user), newAccount: account.newAccount };
};
const authenticateUser = async (authUser: FirebaseUser, name?: string): Promise<AuthenticationResult> => {
  try {
    if (name) await updateFirebaseProfile(authUser, { displayName: name });
    return await beginSession(authUser);
  } catch (failure) {
    if (getFirebaseAuth().currentUser?.uid === authUser.uid) await firebaseSignOut(getFirebaseAuth()).catch(() => undefined);
    throw failure;
  }
};

export const signUp = (input: SignUpInput): Promise<AuthenticationResult> => runAuthentication(async () => {
  const email = normalizeEmail(input?.email);
  validatePassword(input?.password);
  const name = input?.name?.trim()?.replace(/\s+/g, ` `)?.slice(0, 100);
  const credential = await createUserWithEmailAndPassword(getFirebaseAuth(), email, input.password);
  return authenticateUser(credential.user, name);
});

export const signIn = (input: SignInInput): Promise<AuthenticationResult> => runAuthentication(async () => {
  const email = normalizeEmail(input?.email);
  validatePassword(input?.password);
  const credential = await signInWithEmailAndPassword(getFirebaseAuth(), email, input.password);
  return authenticateUser(credential.user);
});

export const signInWithGoogle = (): Promise<AuthenticationResult> => runAuthentication(async () => {
  if (Platform.OS !== `web`) throw new Error(`Use Google Sign In On The Website — Native OAuth Setup Is Required`);
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: `select_account` });
  const credential = await signInWithPopup(getFirebaseAuth(), provider);
  return authenticateUser(credential.user);
});

export const restoreSession = (): Promise<AuthenticationResult | null> => runOperation(async () => {
  if (pendingAuthentication) await pendingAuthentication.catch(() => undefined);
  const auth = getFirebaseAuth();
  await auth.authStateReady();
  if (!auth.currentUser) return null;
  const { user } = await ensureUser(auth.currentUser);
  if (!user.active) throw new AccountDeactivatedError();
  return sessionResult(user);
});
export const signOut = (): Promise<void> => runOperation(() => firebaseSignOut(getFirebaseAuth()));
export const subscribeAuthState = (listener: () => void) => onIdTokenChanged(getFirebaseAuth(), () => listener());
export const completeLegacyClaim = async (_userId: string): Promise<void> => { throw new Error(`Local Data Must Be Imported Explicitly Into Your Firebase Account`); };
export const manageAccount = (action: AccountAction, expectedUserId: string): Promise<null> => runOperation(async () => {
  if (![`deactivate`, `delete-data`, `delete-data-connections`, `delete-account`].includes(action)) throw new Error(`Choose A Valid Account Action`);
  if (action === `delete-account` || action === `deactivate`) throw new Error(`Cloud Account Deletion And Deactivation Are Not Connected Yet`);
  const session = await restoreSession();
  if (!session?.user || !expectedUserId || session.user.id !== expectedUserId) throw new Error(`Sign In To Manage Your Account`);
  try {
    await clearAccountData(expectedUserId, action === `delete-data-connections`);
    const now = new Date().toISOString();
    await updateDoc(doc(getFirebaseDb(), `users`, expectedUserId), { description: ``, publicDomains: false, profilePrivacy: `private`, updated: now, lastUpdated: now });
    await firebaseSignOut(getFirebaseAuth());
    return null;
  } catch (failure) {
    throw new AccountDataCleanupError(friendlyError(failure).message);
  }
});

export const getUsers = (): Promise<User[]> => runOperation(async () => {
  const session = await restoreSession();
  if (session?.user.role !== Roles.Owner) throw new Error(`Owner Access Is Required`);
  const users = await getDocs(collection(getFirebaseDb(), `users`));
  return users.docs.map(record => new User({ ...record.data(), signedIn: record.id === session.user.id }));
});
export const getPublicProfiles = async (): Promise<PublicProfile[]> => [];

export const updateProfile = (input: ProfileInput, expectedUserId?: string): Promise<User> => runOperation(async () => {
  const session = await restoreSession();
  const user = session?.user;
  if (!user || (expectedUserId && user.id !== expectedUserId)) throw new Error(`Sign In To Update Your Profile`);
  if (!input || (input.name !== undefined && typeof input.name !== `string`)) throw new Error(`Enter A Valid Name`);
  if (input.description !== undefined && typeof input.description !== `string`) throw new Error(`Enter A Valid Bio`);
  const name = input.name === undefined ? user.name : input.name.trim().replace(/\s+/g, ` `);
  const description = input.description === undefined ? user.description : input.description.trim();
  const profilePrivacy = input.profilePrivacy ?? user.profilePrivacy;
  if (!name || name.length > 100) throw new Error(`Enter A Name Of 1 To 100 Characters`);
  if (typeof description !== `string` || description.length > 2000) throw new Error(`Use A Bio Of Up To 2000 Characters`);
  if (![`public`, `private`].includes(profilePrivacy)) throw new Error(`Choose Public Or Private`);
  if (input.publicDomains !== undefined && typeof input.publicDomains !== `boolean`) throw new Error(`Choose Whether To Share Domains`);
  const now = new Date().toISOString();
  const changes = { name, description, profilePrivacy, displayName: name, updated: now, lastUpdated: now, publicDomains: input.publicDomains ?? user.publicDomains };
  await updateDoc(doc(getFirebaseDb(), `users`, user.id), changes);
  return new User({ ...user, ...changes, signedIn: true });
});

export const hasSavedAccount = async (): Promise<boolean> => {
  const auth = getFirebaseAuth();
  await auth.authStateReady();
  return Boolean(auth.currentUser);
};
export const getHealth = async () => ({
  ok: true,
  status: 200,
  success: true,
  mode: `firebase`,
  datetime: new Date().toISOString(),
  title: `Domains Database Authentication`,
  message: `Firebase Authentication Connected`,
});
export const getStatus = async () => ({ ...await getHealth(), authenticated: Boolean(await restoreSession()) });
