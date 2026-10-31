import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  updateProfile,
  type User as FirebaseUser,
  type AuthError
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';
import type { User } from '../../types';

// Map Firebase Auth error codes to user-friendly messages
export const getAuthErrorMessage = (error: unknown): string => {
  if (!error) return 'An unexpected error occurred. Please try again.';

  const authError = error as AuthError;
  const code = authError.code || '';

  switch (code) {
    case 'auth/user-not-found':
      return 'No account exists with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please verify and try again.';
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please check your credentials.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email. Try signing in instead.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email using a different sign-in method. Please sign in using your original method.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was cancelled.';
    case 'auth/cancelled-popup-request':
      return 'Previous Google sign-in request was cancelled.';
    case 'auth/popup-blocked':
      return 'Pop-up was blocked by your browser. Please allow pop-ups for this site or use redirect.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection and retry.';
    case 'auth/too-many-requests':
      return 'Too many unsuccessful attempts. Access temporarily disabled. Please reset your password or try again later.';
    case 'auth/expired-action-code':
      return 'This password reset link has expired. Please request a new one.';
    case 'auth/invalid-action-code':
      return 'This password reset link is invalid or has already been used.';
    case 'auth/operation-not-allowed':
      return 'Google Sign-In is not enabled in Firebase Console. Go to Authentication > Sign-in method and enable the Google provider.';
    case 'auth/unauthorized-domain':
      return 'Domain (og-music-rekha.vercel.app) is not authorized in Firebase Console. Please add it in Firebase Authentication > Settings > Authorized Domains.';
    case 'auth/configuration-not-found':
      return 'Firebase Authentication configuration not found. Please verify Google provider is enabled in Firebase Console.';
    default:
      return authError.message || 'Authentication failed. Please try again.';
  }
};

export const isFirebaseConfigured = (): boolean => {
  return Boolean(auth && auth.app.options.apiKey);
};

// Convert Firebase User to OG MUSIC User model
export const mapFirebaseUser = async (fbUser: FirebaseUser): Promise<User> => {
  let displayName = fbUser.displayName || '';
  let photoURL = fbUser.photoURL || '';

  // Extract from providerData if top-level fields are missing
  if ((!displayName || !photoURL) && fbUser.providerData?.length) {
    for (const p of fbUser.providerData) {
      if (!displayName && p.displayName) displayName = p.displayName;
      if (!photoURL && p.photoURL) photoURL = p.photoURL;
    }
  }

  // Check if profile details exist in Firestore users collection
  if (db) {
    try {
      const userDocRef = doc(db, 'users', fbUser.uid);
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data.displayName && !displayName) displayName = data.displayName;
        if (data.photoURL && !photoURL) photoURL = data.photoURL;
      }
    } catch {
      // Non-blocking Firestore lookup fallback
    }
  }

  return {
    id: fbUser.uid,
    email: fbUser.email || '',
    displayName: displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'User'),
    photoURL: photoURL || undefined,
  };
};

const DEV_USERS_KEY = 'og_music_dev_users';
const DEV_CURRENT_USER_KEY = 'og_music_current_user';
const devAuthListeners = new Set<(user: User | null) => void>();

const getStoredDevUsers = (): Record<string, { user: User; passwordHash: string }> => {
  try {
    const raw = localStorage.getItem(DEV_USERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const getStoredDevCurrentUser = (): User | null => {
  try {
    const raw = localStorage.getItem(DEV_CURRENT_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const notifyDevListeners = (user: User | null) => {
  devAuthListeners.forEach(listener => {
    try {
      listener(user);
    } catch {}
  });
};

export const authService = {
  isConfigured: isFirebaseConfigured,

  // Register with email and user-chosen password
  async signUp(email: string, password: string, displayName?: string): Promise<User> {
    if (!auth) {
      // Robust local authentication fallback for testing & offline mode
      const normalizedEmail = email.trim().toLowerCase();
      const users = getStoredDevUsers();
      if (users[normalizedEmail]) {
        const error = new Error('An account already exists with this email. Try signing in instead.') as any;
        error.code = 'auth/email-already-in-use';
        throw error;
      }

      const userId = 'usr_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      const newUser: User = {
        id: userId,
        email: normalizedEmail,
        displayName: displayName?.trim() || (normalizedEmail ? normalizedEmail.split('@')[0] : 'User'),
        photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(userId)}`
      };

      users[normalizedEmail] = { user: newUser, passwordHash: btoa(password) };
      localStorage.setItem(DEV_USERS_KEY, JSON.stringify(users));
      localStorage.setItem(DEV_CURRENT_USER_KEY, JSON.stringify(newUser));
      notifyDevListeners(newUser);
      return newUser;
    }

    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);

    // Set displayName if provided
    if (displayName && displayName.trim()) {
      try {
        await updateProfile(cred.user, { displayName: displayName.trim() });
      } catch {
        // Non-fatal
      }
    }

    // Initialize or merge Firestore user document
    if (db) {
      try {
        await setDoc(doc(db, 'users', cred.user.uid), {
          id: cred.user.uid,
          email: cred.user.email,
          displayName: displayName?.trim() || (cred.user.email ? cred.user.email.split('@')[0] : 'User'),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (err) {
        console.warn('Firestore user profile initialization skipped/offline:', err);
      }
    }

    return mapFirebaseUser(cred.user);
  },

  // Sign in with email and password
  async signIn(email: string, password: string): Promise<User> {
    if (!auth) {
      const normalizedEmail = email.trim().toLowerCase();
      const users = getStoredDevUsers();
      const entry = users[normalizedEmail];
      if (!entry) {
        const error = new Error('No account exists with this email address.') as any;
        error.code = 'auth/user-not-found';
        throw error;
      }
      if (entry.passwordHash !== btoa(password)) {
        const error = new Error('Incorrect password. Please verify and try again.') as any;
        error.code = 'auth/wrong-password';
        throw error;
      }
      localStorage.setItem(DEV_CURRENT_USER_KEY, JSON.stringify(entry.user));
      notifyDevListeners(entry.user);
      return entry.user;
    }

    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);

    // Update last login timestamp in Firestore
    if (db) {
      try {
        await setDoc(doc(db, 'users', cred.user.uid), {
          lastLoginAt: serverTimestamp()
        }, { merge: true });
      } catch {
        // Non-fatal
      }
    }

    return mapFirebaseUser(cred.user);
  },

  // Synchronize Google authenticated user with canonical Firestore user document
  async _syncGoogleUserProfile(fbUser: FirebaseUser): Promise<User> {
    let realDisplayName = fbUser.displayName || '';
    let realPhotoURL = fbUser.photoURL || '';

    // Extract from providerData if top-level fields are missing
    if ((!realDisplayName || !realPhotoURL) && fbUser.providerData?.length) {
      for (const p of fbUser.providerData) {
        if (!realDisplayName && p.displayName) realDisplayName = p.displayName;
        if (!realPhotoURL && p.photoURL) realPhotoURL = p.photoURL;
      }
    }

    // Inspect Firestore to preserve existing customizations
    let existingProfile: any = null;
    if (db) {
      try {
        const snap = await getDoc(doc(db, 'users', fbUser.uid));
        if (snap.exists()) {
          existingProfile = snap.data();
          if (!realDisplayName && existingProfile.displayName) {
            realDisplayName = existingProfile.displayName;
          }
          if (!realPhotoURL && existingProfile.photoURL) {
            realPhotoURL = existingProfile.photoURL;
          }
        }
      } catch (err) {
        console.warn('Firestore read error in _syncGoogleUserProfile:', err);
      }
    }

    if (!realDisplayName) {
      realDisplayName = fbUser.email ? fbUser.email.split('@')[0] : 'User';
    }

    // Save/merge the real Google user profile to Firestore
    if (db) {
      try {
        await setDoc(doc(db, 'users', fbUser.uid), {
          id: fbUser.uid,
          email: fbUser.email || existingProfile?.email || '',
          displayName: realDisplayName,
          photoURL: realPhotoURL || null,
          lastLoginAt: serverTimestamp(),
          authProvider: 'google.com',
          updatedAt: serverTimestamp(),
          createdAt: existingProfile?.createdAt || serverTimestamp(),
        }, { merge: true });
      } catch (err) {
        console.warn('Firestore sync error in _syncGoogleUserProfile:', err);
      }
    }

    return {
      id: fbUser.uid,
      email: fbUser.email || '',
      displayName: realDisplayName,
      photoURL: realPhotoURL || undefined,
    };
  },

  // Process incoming redirect results when returning from Google OAuth
  async handleRedirectResult(): Promise<User | null> {
    if (!auth) return null;
    try {
      const cred = await getRedirectResult(auth);
      if (cred && cred.user) {
        return await this._syncGoogleUserProfile(cred.user);
      }
      return null;
    } catch (error) {
      console.error('Redirect result resolution error:', error);
      throw error;
    }
  },

  // Google Sign-In with popup and redirect fallback
  async signInWithGoogle(): Promise<User> {
    if (!auth) {
      throw new Error('Google Sign-In requires Firebase authentication to be configured in Vercel. Please sign in with email and password or configure Firebase credentials.');
    }

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    provider.addScope('profile');
    provider.addScope('email');

    // On mobile touch devices (iOS Safari, Android Chrome), popups are easily blocked or killed
    const isMobile = typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      await signInWithRedirect(auth, provider);
      throw new Error('Redirecting to Google Sign-In...');
    }

    try {
      const cred = await signInWithPopup(auth, provider);
      return await this._syncGoogleUserProfile(cred.user);
    } catch (error: any) {
      // If popup was blocked or prematurely closed by browser, fall back to redirect
      if (error?.code === 'auth/popup-blocked' || error?.code === 'auth/cancelled-popup-request') {
        await signInWithRedirect(auth, provider);
        throw new Error('Redirecting to Google Sign-In...');
      }
      throw error;
    }
  },

  // Send real password reset email via Firebase Auth
  async sendPasswordReset(email: string): Promise<void> {
    if (!auth) {
      throw new Error('Firebase Authentication is not configured. Please add VITE_FIREBASE_API_KEY in .env.local.');
    }

    // ActionCodeSettings routing back to the app's reset-password route
    const actionCodeSettings = {
      url: `${window.location.origin}/reset-password`,
      handleCodeInApp: true,
    };

    try {
      await sendPasswordResetEmail(auth, email.trim(), actionCodeSettings);
    } catch (err: any) {
      // For security, if auth/user-not-found is returned, we can still show a generic success in UI,
      // but re-throw if it's an invalid-email or configuration error.
      if (err?.code === 'auth/user-not-found') {
        // Return cleanly to prevent email enumeration attacks
        return;
      }
      throw err;
    }
  },

  // Verify the reset code delivered in the email link
  async verifyResetCode(oobCode: string): Promise<string> {
    if (!auth) {
      throw new Error('Firebase Authentication is not configured.');
    }
    return verifyPasswordResetCode(auth, oobCode);
  },

  // Confirm password reset with new password
  async confirmPasswordReset(oobCode: string, newPassword: string): Promise<void> {
    if (!auth) {
      throw new Error('Firebase Authentication is not configured.');
    }
    await confirmPasswordReset(auth, oobCode, newPassword);
  },

  // Sign out
  async signOut(): Promise<void> {
    if (!auth) {
      localStorage.removeItem(DEV_CURRENT_USER_KEY);
      notifyDevListeners(null);
      return;
    }
    await signOut(auth);
  },

  // Subscribe to real auth state changes
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    if (!auth) {
      const initial = getStoredDevCurrentUser();
      callback(initial);
      devAuthListeners.add(callback);
      
      const storageHandler = (e: StorageEvent) => {
        if (e.key === DEV_CURRENT_USER_KEY) {
          callback(getStoredDevCurrentUser());
        }
      };
      window.addEventListener('storage', storageHandler);

      return () => {
        devAuthListeners.delete(callback);
        window.removeEventListener('storage', storageHandler);
      };
    }

    return onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const user = await mapFirebaseUser(fbUser);
          callback(user);
        } catch {
          callback({
            id: fbUser.uid,
            email: fbUser.email || '',
            displayName: fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'User')
          });
        }
      } else {
        callback(null);
      }
    });
  }
};
