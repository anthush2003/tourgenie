




import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as auth from '@/services/auth';
import type { AuthUser } from '@/services/auth';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    auth.setLogoutListener(() => {
      setUser(null);
    });
    (async () => {
      const [token, storedUser] = await Promise.all([auth.getToken(), auth.getStoredUser()]);
      if (token && storedUser) setUser(storedUser);
      setLoading(false);
    })();
  }, []);

  const doLogin = useCallback(async (email: string, password: string) => {
    const u = await auth.login(email, password);
    setUser(u);
  }, []);

  const doRegister = useCallback(async (name: string, email: string, password: string) => {
    const u = await auth.register(name, email, password);
    setUser(u);
  }, []);

  const doLogout = useCallback(async () => {
    await auth.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, login: doLogin, register: doRegister, logout: doLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
