import { Platform } from 'react-native';
import * as firebaseAuth from 'firebase/auth';
import { firebaseConfig, firebaseEnabled } from './config';
import { getFirestore, type Firestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApps, getApp, initializeApp, type FirebaseApp } from 'firebase/app';

let auth: firebaseAuth.Auth | undefined;
let database: Firestore | undefined;
const getFirebaseApp = (): FirebaseApp => {
  if (!firebaseEnabled) throw new Error(`Connect Firebase To Save Your Account`);
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
};

export const getFirebaseAuth = (): firebaseAuth.Auth => {
  if (auth) return auth;
  const app = getFirebaseApp();
  if (Platform.OS === `web`) auth = firebaseAuth.getAuth(app);
  else {
    const nativeAuth = firebaseAuth as typeof firebaseAuth & {
      getReactNativePersistence: (storage: typeof AsyncStorage) => firebaseAuth.Persistence;
    };
    try {
      auth = firebaseAuth.initializeAuth(app, { persistence: nativeAuth.getReactNativePersistence(AsyncStorage) });
    } catch (failure) {
      if ((failure as { code?: string })?.code !== `auth/already-initialized`) throw failure;
      auth = firebaseAuth.getAuth(app);
    }
  }
  return auth;
};

export const getFirebaseDb = (): Firestore => database ??= getFirestore(getFirebaseApp());
