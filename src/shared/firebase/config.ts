export const firebaseConfig = {
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? ``,
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? ``,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? ``,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? ``,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? ``,
};

export const firebaseEnabled = Boolean(firebaseConfig.apiKey && firebaseConfig.appId && firebaseConfig.projectId && firebaseConfig.authDomain);
