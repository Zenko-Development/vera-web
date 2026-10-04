'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { AuthContext } from './auth-context';
import { sessionController } from '@/entities/auth/controller/session.controller';
import { useApiInitialized } from '@/features/api/ApiInitializer';
import type { AuthIdentity } from '@/entities/auth/model/types';
import { ScreenLoader } from '@/widgets/screen-loader/ScreenLoader';
import { AUTH_FAILURE_EVENT, tokenStorage } from '@/shared/lib/storage';

export const AuthProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [user, setUser] = useState<AuthIdentity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMountedRef = useRef(true);
  const { isInitialized: isApiInitialized } = useApiInitialized();
  const isAuth = !!user;

  useEffect(() => {
    isMountedRef.current = true;
    const handleAuthFailure = () => setUser(null);
    window.addEventListener(AUTH_FAILURE_EVENT, handleAuthFailure);

    return () => {
      isMountedRef.current = false;
      window.removeEventListener(AUTH_FAILURE_EVENT, handleAuthFailure);
    };
  }, []);

  const login = useCallback(async ({
    username,
    password,
  }: {
    username: string;
    password: string;
  }) => {
    const identity = await sessionController.login({ username, password });
    
    if (isMountedRef.current) {
      setUser(identity);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await sessionController.logout();
    } catch (error) {
      console.error('[AuthProvider] Logout API call failed:', error);
    } finally {
      if (isMountedRef.current) {
        setUser(null);
      }
    }
  }, []);

  const checkAuth = useCallback(async () => {
    const access = tokenStorage.getAccess();
    if (!access) {
      setUser(null);
      return false;
    }

    try {
      const identity = await sessionController.getCurrentIdentity();
      if (isMountedRef.current) setUser(identity);
      return true;
    } catch {
      tokenStorage.clear();
      if (isMountedRef.current) setUser(null);
      return false;
    }
  }, []);

  useEffect(() => {
    if (!isApiInitialized) return;
    
    const init = async () => {
      await checkAuth();
      if (isMountedRef.current) setIsLoading(false);
    };
    
    init();
  }, [isApiInitialized, checkAuth]);

  if (!isApiInitialized || isLoading) {
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
