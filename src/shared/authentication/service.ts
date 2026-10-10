import * as local from './service.local';
import * as firebase from './firebase';
import { useLocalStorage } from '../config';
import { firebaseEnabled } from '../firebase/config';
import type { User } from '../models/users/User';
import { subscribeStorage } from '../common/storage';

const useFirebaseAuthentication = firebaseEnabled && !useLocalStorage;
const service = useFirebaseAuthentication ? firebase : local;
export const AUTH_ACCOUNTS_KEY = local.AUTH_ACCOUNTS_KEY;
export const AUTH_SESSION_KEY = local.AUTH_SESSION_KEY;
export const normalizeEmail = local.normalizeEmail;
export const signIn = service.signIn;
export const signUp = service.signUp;
export const signOut = service.signOut;
export const getUsers = service.getUsers;
export const getHealth = service.getHealth;
export const getStatus = service.getStatus;
export const manageAccount = service.manageAccount;
export const updateProfile = service.updateProfile;
export const restoreSession = service.restoreSession;
export const getPublicProfiles = service.getPublicProfiles;
export const completeLegacyClaim = service.completeLegacyClaim;
export const signInWithGoogle = async () => {
  if (!useFirebaseAuthentication) throw new Error(`Connect Firebase And Turn Off Local Mode To Use Google Sign In`);
  return firebase.signInWithGoogle();
};
export const subscribeAuthState = (listener: () => void) => useFirebaseAuthentication ? firebase.subscribeAuthState(listener) : () => undefined;
export const subscribeUsers = (onValue: (users: User[]) => void, onError?: (error: Error) => void) => {
  if (useFirebaseAuthentication) return firebase.subscribeUsers(onValue, onError);
  let active = true;
  let revision = 0;
  const refresh = () => {
    const request = ++revision;
    void local.getUsers().then(users => { if (active && request === revision) onValue(users); })
      .catch(failure => { if (active && request === revision) onError?.(failure instanceof Error ? failure : new Error(`Could Not Load User(s)`)); });
  };
  const stopAccounts = subscribeStorage(AUTH_ACCOUNTS_KEY, refresh, onError);
  const stopSession = subscribeStorage(AUTH_SESSION_KEY, refresh, onError);
  return () => { active = false; revision++; stopAccounts(); stopSession(); };
};
