import { genID } from '../common/ids';
import { Platform } from 'react-native';
import { useLocalStorage } from '../config';
import { User } from '../models/users/User';
import { clearAccountData } from '../accountData/service';
import { Roles, Types, Providers } from '../../types/types';
import type { ProfileInput, PublicProfile } from '../models/users/User';
import { AccountDeactivatedError, AccountDataCleanupError, type AccountAction } from './types';
import { readStorage, writeStorage, removeStorage, createOperationQueue } from '../common/storage';
import type { LocalAccount, LocalSession, SignInInput, SignUpInput, AccountSnapshot, AuthenticationResult } from './types';
import { secureRandomHex, sessionTokenHash, createSecureUuid, verifyPassword, verifySessionToken, isPasswordCredential, createPasswordCredential } from './password';

export const AUTH_ACCOUNTS_KEY = `domains-database:accounts:v1`;
export const AUTH_SESSION_KEY = `domains-database:session:v1`;
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000;
const serialize = createOperationQueue();
const avatarColors = [`#138b8b`, `#725d85`, `#966942`, `#416f9d`, `#957467`, `#59774c`];

const runOperation = <T,>(operation: () => Promise<T>): Promise<T> => serialize(async () => {
  if (Platform.OS === `web` && typeof navigator !== `undefined` && navigator.locks?.request) {
    return await navigator.locks.request(AUTH_ACCOUNTS_KEY, operation);
  }
  return await operation();
});

const requireLocalAuthentication = () => {
  if (!useLocalStorage) throw new Error(`Connect A Backend To Use Authentication`);
};

export const normalizeEmail = (value: string) => {
  const email = value?.trim()?.toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error(`Enter A Valid Email Address`);
  return email;
};

const validatePassword = (password: string) => {
  if (typeof password !== `string` || !password) throw new Error(`Enter A Password`);
};

const publicUser = (user: User, signedIn = true) => new User({ ...user, signedIn });
const accountResult = (account: LocalAccount, expiresAt: number): AuthenticationResult => ({
  expiresAt,
  user: publicUser(account.user),
  claimLegacy: account.user.number === 1 && !account.legacyPortfolioClaimed,
});

const readAccounts = async (): Promise<AccountSnapshot> => {
  const stored = await readStorage(AUTH_ACCOUNTS_KEY);
  if (!stored) return { version: 1, nextNumber: 1, accounts: [] };
  let parsed: AccountSnapshot;
  try {
    parsed = JSON.parse(stored) as AccountSnapshot;
  } catch {
    throw new Error(`Saved Accounts Could Not Be Read`);
  }
  if (parsed?.version !== 1 || !Array.isArray(parsed.accounts) || !Number.isSafeInteger(parsed.nextNumber) || parsed.nextNumber < 1) {
    throw new Error(`Saved Account Data Has An Unsupported Format`);
  }
  const ids = new Set<string>();
  const emails = new Set<string>();
  const numbers = new Set<number>();
  parsed.accounts = parsed.accounts.map(account => {
    const profile = account?.user;
    const number = profile?.number;
    const id = profile?.id;
    if (!profile || typeof id !== `string` || !id.startsWith(`User_${number}_`) || !Number.isSafeInteger(number) || number < 1
      || typeof profile.name !== `string` || !profile.name.trim() || typeof profile.email !== `string`
      || !Object.values(Roles).includes(profile.role as Roles) || !isPasswordCredential(account.credential)
      || (account.sessionTokenHash !== undefined && !/^[a-f0-9]{64}$/.test(account.sessionTokenHash))) {
      throw new Error(`Saved Account Data Is Incomplete`);
    }
    const email = normalizeEmail(profile.email);
    if (ids.has(id) || emails.has(email) || numbers.has(number)) throw new Error(`Saved Account Data Contains Duplicate Accounts`);
    ids.add(id); emails.add(email); numbers.add(number);
    return { ...account, user: publicUser(new User({ ...profile, email }), false) };
  });
  parsed.nextNumber = Math.max(parsed.nextNumber, ...parsed.accounts.map(account => account.user.number + 1));
  return parsed;
};

const saveAccounts = (snapshot: AccountSnapshot) => writeStorage(AUTH_ACCOUNTS_KEY, JSON.stringify(snapshot));

const readSessionAccount = async (snapshot: AccountSnapshot): Promise<{ account: LocalAccount; expiresAt: number } | null> => {
  const stored = await readStorage(AUTH_SESSION_KEY);
  if (!stored) return null;
  let session: LocalSession;
  try {
    session = JSON.parse(stored) as LocalSession;
  } catch {
    await removeStorage(AUTH_SESSION_KEY);
    return null;
  }
  const validSession = session?.version === 1 && typeof session.userId === `string`
    && typeof session.token === `string` && /^[a-f0-9]{64}$/.test(session.token)
    && Number.isFinite(session.expiresAt) && session.expiresAt > Date.now();
  const account = validSession ? snapshot.accounts.find(item => item.user.id === session.userId && item.user.active !== false) : undefined;
  if (!account?.sessionTokenHash || !verifySessionToken(session.token, account.sessionTokenHash)) {
    await removeStorage(AUTH_SESSION_KEY);
    return null;
  }
  return { account, expiresAt: session.expiresAt };
};

const beginSession = async (snapshot: AccountSnapshot, account: LocalAccount) => {
  const token = await secureRandomHex();
  const now = new Date().toISOString();
  account.user = new User({ ...account.user, updated: now, lastSignIn: now, signedIn: false });
  account.sessionTokenHash = sessionTokenHash(token);
  const session: LocalSession = { token, version: 1, userId: String(account.user.id), expiresAt: Date.now() + SESSION_DURATION };
  await saveAccounts(snapshot);
  await writeStorage(AUTH_SESSION_KEY, JSON.stringify(session));
  return accountResult(account, session.expiresAt);
};

export const signUp = (input: SignUpInput): Promise<AuthenticationResult> => runOperation(async () => {
  requireLocalAuthentication();
  const email = normalizeEmail(input?.email);
  const name = (input?.name?.trim()?.replace(/\s+/g, ` `) || email.split(`@`)[0] || `Account`).slice(0, 100);
  validatePassword(input?.password);
  const snapshot = await readAccounts();
  if (snapshot.accounts.some(account => account.user.email === email)) throw new Error(`An Account Already Uses This Email`);
  const credential = await createPasswordCredential(input.password);
  const uuid = await createSecureUuid();
  const number = snapshot.nextNumber;
  const id = genID(Types.User, number, name, new Date(), uuid).id;
  const now = new Date().toISOString();
  const color = avatarColors[(number - 1) % avatarColors.length]!;
  const user = new User({
    id,
    uuid,
    name,
    email,
    number,
    uid: id,
    active: true,
    created: now,
    updated: now,
    signedIn: false,
    verified: false,
    emailVerified: false,
    role: Roles.Subscriber,
    provider: Providers.Local,
    roles: [Roles.Subscriber],
    color: { color, name: `User ${number}`, type: `dark` },
  });
  const account: LocalAccount = { user, credential, legacyPortfolioClaimed: number !== 1 };
  snapshot.accounts.push(account);
  snapshot.nextNumber = number + 1;
  return { ...await beginSession(snapshot, account), newAccount: true };
});

export const signIn = (input: SignInInput): Promise<AuthenticationResult> => runOperation(async () => {
  requireLocalAuthentication();
  const email = normalizeEmail(input?.email);
  validatePassword(input?.password);
  const snapshot = await readAccounts();
  const account = snapshot.accounts.find(item => item.user.email === email);
  if (!account || !await verifyPassword(input.password, account.credential)) throw new Error(`Email Or Password Is Incorrect`);
  if (account.user.active === false) {
    if (input.reactivate !== true) throw new AccountDeactivatedError();
    account.user = new User({ ...account.user, active: true });
  }
  return beginSession(snapshot, account);
});

export const restoreSession = (): Promise<AuthenticationResult | null> => runOperation(async () => {
  if (!useLocalStorage) return null;
  const snapshot = await readAccounts();
  const session = await readSessionAccount(snapshot);
  return session ? accountResult(session.account, session.expiresAt) : null;
});

export const completeLegacyClaim = (userId: string): Promise<void> => runOperation(async () => {
  requireLocalAuthentication();
  const snapshot = await readAccounts();
  const account = (await readSessionAccount(snapshot))?.account;
  if (!account || account.user.id !== userId) throw new Error(`Sign In To Access Your Saved Data`);
  if (!account.legacyPortfolioClaimed) {
    account.legacyPortfolioClaimed = true;
    await saveAccounts(snapshot);
  }
});

export const signOut = (): Promise<void> => runOperation(async () => {
  if (!useLocalStorage) return;
  const snapshot = await readAccounts();
  const account = (await readSessionAccount(snapshot))?.account;
  await removeStorage(AUTH_SESSION_KEY);
  if (account?.sessionTokenHash) {
    delete account.sessionTokenHash;
    await saveAccounts(snapshot);
  }
});

export const manageAccount = (action: AccountAction, expectedUserId: string): Promise<null> => runOperation(async () => {
  requireLocalAuthentication();
  if (![`deactivate`, `delete-data`, `delete-data-connections`, `delete-account`].includes(action)) throw new Error(`Choose A Valid Account Action`);
  const snapshot = await readAccounts();
  const account = (await readSessionAccount(snapshot))?.account;
  if (!account || !expectedUserId || account.user.id !== expectedUserId) throw new Error(`Sign In To Manage Your Account`);
  const now = new Date().toISOString();
  account.user = new User({ ...account.user, updated: now, lastUpdated: now, signedIn: false, active: action !== `deactivate` });
  if (action !== `deactivate`) account.legacyPortfolioClaimed = true;
  delete account.sessionTokenHash;
  await saveAccounts(snapshot);
  await removeStorage(AUTH_SESSION_KEY);
  if (action === `deactivate`) return null;
  try {
    await clearAccountData(expectedUserId, action !== `delete-data`);
    if (action === `delete-account`) snapshot.accounts = snapshot.accounts.filter(item => item.user.id !== expectedUserId);
    else account.user = new User({ ...account.user, description: ``, publicDomains: false, profilePrivacy: `private` });
    await saveAccounts(snapshot);
    return null;
  } catch (failure) {
    throw new AccountDataCleanupError(failure instanceof Error ? failure.message : `Account Data Could Not Be Deleted`);
  }
});

export const getUsers = (): Promise<User[]> => runOperation(async () => {
  requireLocalAuthentication();
  const snapshot = await readAccounts();
  const account = (await readSessionAccount(snapshot))?.account;
  if (account?.user.role !== Roles.Owner) throw new Error(`Owner Access Is Required`);
  return snapshot.accounts.map(item => publicUser(item.user, item.user.id === account.user.id));
});

export const getPublicProfiles = (): Promise<PublicProfile[]> => runOperation(async () => {
  if (!useLocalStorage) return [];
  const snapshot = await readAccounts();
  const current = (await readSessionAccount(snapshot))?.account.user;
  return snapshot.accounts.filter(account => account.user.active && (account.user.profilePrivacy === `public` || account.user.id === current?.id)).map(({ user }) => ({
    id: user.id,
    name: user.name,
    description: user.description,
    color: { ...user.color },
    photoURL: user.photoURL,
    publicDomains: user.publicDomains,
    profilePrivacy: user.profilePrivacy,
  }));
});

export const updateProfile = (input: ProfileInput, expectedUserId?: string): Promise<User> => runOperation(async () => {
  requireLocalAuthentication();
  const snapshot = await readAccounts();
  const account = (await readSessionAccount(snapshot))?.account;
  if (!account || (expectedUserId && account.user.id !== expectedUserId)) throw new Error(`Sign In To Update Your Profile`);
  if (!input || (input.name !== undefined && typeof input.name !== `string`)) throw new Error(`Enter A Valid Name`);
  if (input.description !== undefined && typeof input.description !== `string`) throw new Error(`Enter A Valid Bio`);
  const name = input.name === undefined ? account.user.name : input.name.trim().replace(/\s+/g, ` `);
  const description = input.description === undefined ? account.user.description : input.description.trim();
  const profilePrivacy = input.profilePrivacy ?? account.user.profilePrivacy;
  if (!name || name.length > 100) throw new Error(`Enter A Name Of 1 To 100 Characters`);
  if (typeof description !== `string` || description.length > 2000) throw new Error(`Use A Bio Of Up To 2000 Characters`);
  if (![`public`, `private`].includes(profilePrivacy)) throw new Error(`Choose Public Or Private`);
  if (input.publicDomains !== undefined && typeof input.publicDomains !== `boolean`) throw new Error(`Choose Whether To Share Domains`);
  const now = new Date().toISOString();
  account.user = new User({ ...account.user, name, description, profilePrivacy, displayName: name, updated: now, lastUpdated: now, publicDomains: input.publicDomains ?? account.user.publicDomains });
  await saveAccounts(snapshot);
  return publicUser(account.user);
});

export const getHealth = async () => ({
  ok: true,
  status: 200,
  success: true,
  mode: useLocalStorage ? `local` : `backend-required`,
  datetime: new Date().toISOString(),
  title: `Domains Database Authentication`,
  message: useLocalStorage ? `Local Authentication Ready` : `Connect An Authentication Backend`,
});

export const getStatus = async () => ({
  ...await getHealth(),
  authenticated: Boolean(await restoreSession()),
});
