'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { AuthContext } from './auth-context';
import { authApi } from '@/entities/auth/api/auth';
import type { User } from '@/entities/auth/model/types';
import { ScreenLoader } from '@/widgets/ScreenLoader/ScreenLoader';

export const AuthProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMountedRef = useRef(true);

  const isAuth = !!user;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const login = useCallback(async ({
    accessToken,
    refreshToken,
  }: {
    accessToken: string;
    refreshToken: string;
  }) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    
    // Берём user из ответа login
    const response = await authApi.login({ id: 'testuser', password: 'test' });
    
    if (isMountedRef.current) {
      setUser(response.user);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('[AuthProvider] Logout API call failed:', error);
    } finally {
      if (isMountedRef.current) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
      }
    }
  }, []);

  const checkAuth = useCallback(async () => {
    const accessToken = localStorage.getItem('access_token');

    if (!accessToken) {
      setUser(null);
      return false;
    }

    // Для моков просто создаём тестового пользователя
    if (isMountedRef.current) {
      setUser({
        id: '1',
        username: 'testuser',
        role: 'student',
      });
    }
    return true;
  }, []);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await checkAuth();
      setIsLoading(false);
    };
    
    init();
  }, [checkAuth]);

  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || isLoading) {
    return <ScreenLoader />;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuth,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};