'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import apiClient from '@/lib/api/client';
import type { User, AuthResponse, RegisterPayload, LoginPayload, GuestOTPPayload, VerifyOTPPayload } from '@/lib/types/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  register: (payload: RegisterPayload) => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  sendGuestOTP: (payload: GuestOTPPayload) => Promise<void>;
  verifyOTP: (payload: VerifyOTPPayload) => Promise<void>;
  updateLocation: (location: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('queuem_token');
    const savedUser = localStorage.getItem('queuem_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const saveSession = (authRes: AuthResponse) => {
    setUser(authRes.user);
    setToken(authRes.token);
    localStorage.setItem('queuem_token', authRes.token);
    localStorage.setItem('queuem_user', JSON.stringify(authRes.user));
  };

  const register = useCallback(async (payload: RegisterPayload) => {
    const { data } = await apiClient.post<AuthResponse>('/auth/register', payload);
    saveSession(data);
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);
    saveSession(data);
  }, []);

  const sendGuestOTP = useCallback(async (payload: GuestOTPPayload) => {
    await apiClient.post('/auth/guest-otp', payload);
  }, []);

  const verifyOTP = useCallback(async (payload: VerifyOTPPayload) => {
    const { data } = await apiClient.post<AuthResponse>('/auth/verify-otp', payload);
    saveSession(data);
  }, []);

  const updateLocation = useCallback(async (location: string) => {
    await apiClient.patch('/auth/update-location', { location_current: location });
    if (user) {
      const updatedUser = { ...user, location_current: location };
      setUser(updatedUser);
      localStorage.setItem('queuem_user', JSON.stringify(updatedUser));
    }
  }, [user]);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('queuem_token');
    localStorage.removeItem('queuem_user');
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        register,
        login,
        sendGuestOTP,
        verifyOTP,
        updateLocation,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
