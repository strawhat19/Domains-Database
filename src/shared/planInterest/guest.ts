import { Platform } from 'react-native';
import * as firebaseAuth from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '../firebase/config';
import { getApps, getApp, initializeApp } from 'firebase/app';
import AsyncStorage from '@react-native-async-storage/async-storage';

const appName = `plan-voting`;
let auth: firebaseAuth.Auth | undefined;
let pendingGuest: Promise<firebaseAuth.User> | undefined;
const guestApp = () => getApps().some(app => app.name === appName) ? getApp(appName) : initializeApp(firebaseConfig, appName);
export const getGuestVotingAuth = () => {
  if (auth) return auth;
  const app = guestApp();
  if (Platform.OS === `web`) auth = firebaseAuth.getAuth(app);
  else {
    const nativeAuth = firebaseAuth as typeof firebaseAuth & {
      getReactNativePersistence: (storage: typeof AsyncStorage) => firebaseAuth.Persistence;
    };
    try { auth = firebaseAuth.initializeAuth(app, { persistence: nativeAuth.getReactNativePersistence(AsyncStorage) }); }
    catch (failure) {
      if ((failure as { code?: string })?.code !== `auth/already-initialized`) throw failure;
      auth = firebaseAuth.getAuth(app);
    }
  }
  return auth;
};
export const getGuestVotingDb = () => getFirestore(guestApp());
export const restoreGuestVotingIdentity = async (create = false): Promise<firebaseAuth.User | null> => {
  const auth = getGuestVotingAuth();
  await auth.authStateReady();
  if (auth.currentUser) {
    if (!auth.currentUser.isAnonymous) throw new Error(`Guest Voting Identity Needs Attention`);
    return auth.currentUser;
  }
  if (!create) return null;
  if (!pendingGuest) pendingGuest = firebaseAuth.signInAnonymously(auth).then(result => result.user).finally(() => { pendingGuest = undefined; });
  return pendingGuest;
};
