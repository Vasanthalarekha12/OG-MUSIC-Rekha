import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  browserLocalPersistence,
  indexedDBLocalPersistence,
  browserPopupRedirectResolver,
  type Auth
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCQQ-rkBouLcw-EsR64ftZjt0eK2imaI04",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "og-music-3b3db.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "og-music-3b3db",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "og-music-3b3db.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "229513190731",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:229513190731:web:d8eae0af554d973ddc1cce",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-9HS5QE0XZN",
};

// Initialize Firebase only once to prevent duplicate app instances
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

try {
  if (firebaseConfig.apiKey) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

    // Use initializeAuth with robust mobile persistence (indexedDB with localStorage fallback)
    try {
      auth = initializeAuth(app, {
        persistence: [indexedDBLocalPersistence, browserLocalPersistence],
        popupRedirectResolver: browserPopupRedirectResolver,
      });
    } catch {
      // If already initialized (e.g. fast-refresh / HMR)
      auth = getAuth(app);
    }

    db = getFirestore(app);
  } else {
    console.warn('Firebase configuration missing (VITE_FIREBASE_API_KEY not defined).');
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
}

export { app, auth, db, firebaseConfig };
