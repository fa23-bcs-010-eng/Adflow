'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import api from './api';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'client' | 'moderator' | 'admin' | 'super_admin';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { full_name: string; email: string; password: string; role?: string }) => Promise<void>;
  demoLogin: (role: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('ag_token');
    const storedUser = localStorage.getItem('ag_user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('ag_token', data.token);
    localStorage.setItem('ag_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  };

  const register = async (body: { full_name: string; email: string; password: string; role?: string }) => {
    const { data } = await api.post('/auth/register', body);
    localStorage.setItem('ag_token', data.token);
    localStorage.setItem('ag_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('ag_token');
    localStorage.removeItem('ag_user');
    setToken(null);
    setUser(null);
  };

  const demoLogin = async (role: string) => {
    const { data } = await api.post('/auth/demo', { role });
    localStorage.setItem('ag_token', data.token);
    localStorage.setItem('ag_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, demoLogin, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
