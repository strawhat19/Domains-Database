export const firebaseConfig = {
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? `domainsdatabase-e62a3`,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? `1:787162310123:web:2f5d53414f4b3b602225ae`,
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? `AIzaSyBsLrg3SWPAE3-OuNNa9SD4GjKhZalj4lk`,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? `787162310123`,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? `domainsdatabase-e62a3.firebaseapp.com`,
};

export const firebaseEnabled = Boolean(firebaseConfig.apiKey && firebaseConfig.appId && firebaseConfig.projectId && firebaseConfig.authDomain);
