'use client';
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api, authApi } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('userData');
    if (token && userData) {
      api.setToken(token);
      try {
        setUser(JSON.parse(userData));
      } catch { /* ignore */ }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    api.setToken(response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    localStorage.setItem('userData', JSON.stringify(response.user));
    setUser(response.user);
  }, []);

  const register = useCallback(async (email: string, name: string, password: string) => {
    const response = await authApi.register({ email, name, password });
    api.setToken(response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    localStorage.setItem('userData', JSON.stringify(response.user));
    setUser(response.user);
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    api.setToken(null);
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userData');
    setUser(null);
  }, []);

  const isAdmin = user?.roles?.includes('admin') ?? false;
  const hasPermission = useCallback((perm: string) => {
    if (isAdmin) return true;
    return user?.permissions?.includes(perm) ?? false;
  }, [user, isAdmin]);
  const hasRole = useCallback((role: string) => user?.roles?.includes(role) ?? false, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAdmin, hasPermission, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
