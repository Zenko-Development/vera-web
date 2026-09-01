'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { AuthContext } from './auth-context';
import { authApi } from '@/entities/auth/api/auth';
import { useApiInitialized } from '@/features/api/ApiInitializer';
import type { User } from '@/entities/auth/model/types';
import { ScreenLoader } from '@/widgets/screen-loader/ScreenLoader';

export const AuthProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMountedRef = useRef(true);
  const { isInitialized: isApiInitialized } = useApiInitialized();
  const pathname = usePathname();
  const prevPathnameRef = useRef(pathname);

  const isAuth = !!user;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const login = useCallback(async ({
    username,
    password,
  }: {
    username: string;
    password: string;
  }) => {
    console.log('[AuthProvider] Logging in...');
    
    // Вызываем API с данными пользователя
    const response = await authApi.login({ username, password });
    
    localStorage.setItem('access_token', response.accessToken);
    localStorage.setItem('refresh_token', response.refreshToken);
    
    if (isMountedRef.current) {
      setUser(response.user);
      console.log('[AuthProvider] Login successful');
    }
  }, []);

  const logout = useCallback(async () => {
    console.log('[AuthProvider] Logging out...');
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
      console.log('[AuthProvider] Logout successful');
    }
  }, []);

  const checkAuth = useCallback(async () => {
    console.log('[AuthProvider] Checking auth state...');
    const access = localStorage.getItem('access_token');

    if (!access) {
      console.log('[AuthProvider] No access token found');
      setUser(null);
      return false;
    }

    // Для моков создаём тестового пользователя
    if (isMountedRef.current) {
      setUser({
        id: '1',
        username: 'admin',
        role: 'student',
      });
    }
    console.log('[AuthProvider] Auth state verified successfully');
    return true;
  }, []);

  useEffect(() => {
    if (!isApiInitialized) return;
    
    const init = async () => {
      setIsLoading(true);
      await checkAuth();
      setIsLoading(false);
    };
    
    init();
  }, [isApiInitialized, checkAuth]);

  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || !isApiInitialized || isLoading) {
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