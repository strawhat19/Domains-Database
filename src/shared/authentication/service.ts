import * as local from './service.local';
import * as firebase from './firebase';
import { useLocalStorage } from '../config';
import { firebaseEnabled } from '../firebase/config';

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
