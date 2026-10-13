import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User, AuthSession, LoginCredentials } from '../types/auth';
import { getStoredSession, persistSession, clearSession, login as apiLogin, logout as apiLogout } from '../services/authApi';

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials, remember?: boolean) => Promise<AuthSession>;
  logout: () => Promise<void>;
  updateUser: (partialUser: Partial<User>) => void;
  refreshSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(() => getStoredSession());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync session on mount
  useEffect(() => {
    const stored = getStoredSession();
    setSession(stored);
    setIsLoading(false);
  }, []);

  const refreshSession = useCallback(() => {
    const current = getStoredSession();
    setSession(current);
  }, []);

  const login = useCallback(async (credentials: LoginCredentials, remember = true): Promise<AuthSession> => {
    setIsLoading(true);
    try {
      const authSession = await apiLogin(credentials);
      persistSession(authSession, remember);
      setSession(authSession);
      return authSession;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      await apiLogout();
    } finally {
      clearSession();
      setSession(null);
      setIsLoading(false);
    }
  }, []);

  const updateUser = useCallback((partialUser: Partial<User>) => {
    setSession((prev) => {
      if (!prev || !prev.user) return prev;
      const updatedUser: User = { ...prev.user, ...partialUser };
      const updatedSession: AuthSession = { ...prev, user: updatedUser };

      // Update in storage as well
      for (const storage of [localStorage, sessionStorage]) {
        if (storage.getItem('ai-tutor.user')) {
          storage.setItem('ai-tutor.user', JSON.stringify(updatedUser));
        }
      }

      return updatedSession;
    });
  }, []);

  const value = React.useMemo<AuthContextType>(() => ({
    user: session?.user ?? null,
    token: session?.accessToken ?? null,
    isAuthenticated: Boolean(session?.accessToken && session?.user),
    isLoading,
    login,
    logout,
    updateUser,
    refreshSession,
  }), [session, isLoading, login, logout, updateUser, refreshSession]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
