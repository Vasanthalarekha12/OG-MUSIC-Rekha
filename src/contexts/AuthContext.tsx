import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';
import { recommendationService } from '../services/recommendationService';
import { authService } from '../services/firebase/authService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isConfigured: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, displayName?: string) => Promise<User>;
  loginWithGoogle: () => Promise<User>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  confirmPasswordReset: (oobCode: string, newPassword: string) => Promise<void>;
  verifyResetCode: (oobCode: string) => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isConfigured = authService.isConfigured();

  useEffect(() => {
    let unsubscribe: () => void = () => {};

    // Subscribe to Firebase real auth state
    unsubscribe = authService.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      recommendationService.setUser(currentUser?.id);
      setIsLoading(false);
    });

    // Safety timeout: ensure loading state resolves in maximum 2.5s even if Firebase is unreachable
    const safetyTimer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);

    return () => {
      unsubscribe();
      clearTimeout(safetyTimer);
    };
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const loggedUser = await authService.signIn(email, password);
    setUser(loggedUser);
    recommendationService.setUser(loggedUser.id);
    return loggedUser;
  };

  const register = async (email: string, password: string, displayName?: string): Promise<User> => {
    const newUser = await authService.signUp(email, password, displayName);
    setUser(newUser);
    recommendationService.setUser(newUser.id);
    return newUser;
  };

  const loginWithGoogle = async (): Promise<User> => {
    const googleUser = await authService.signInWithGoogle();
    setUser(googleUser);
    recommendationService.setUser(googleUser.id);
    return googleUser;
  };

  const logout = async (): Promise<void> => {
    await authService.signOut();
    setUser(null);
    recommendationService.setUser(undefined);
  };

  const resetPassword = async (email: string): Promise<void> => {
    await authService.sendPasswordReset(email);
  };

  const confirmPasswordReset = async (oobCode: string, newPassword: string): Promise<void> => {
    await authService.confirmPasswordReset(oobCode, newPassword);
  };

  const verifyResetCode = async (oobCode: string): Promise<string> => {
    return authService.verifyResetCode(oobCode);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isConfigured,
      login,
      register,
      loginWithGoogle,
      logout,
      resetPassword,
      confirmPasswordReset,
      verifyResetCode
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

