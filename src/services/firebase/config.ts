import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';

const rawApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const rawProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const rawAuthDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
const rawStorageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;

const firebaseConfig = {
  apiKey: rawApiKey,
  authDomain: rawAuthDomain || (rawProjectId ? `${rawProjectId}.firebaseapp.com` : undefined),
  projectId: rawProjectId,
  storageBucket: rawStorageBucket || (rawProjectId ? `${rawProjectId}.firebasestorage.app` : undefined),
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase only if config is present to prevent crashes during dev setup
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

try {
  if (firebaseConfig.apiKey) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } else {
    console.warn('Firebase configuration missing (VITE_FIREBASE_API_KEY not defined).');
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
}

export { app, auth, db, firebaseConfig };
