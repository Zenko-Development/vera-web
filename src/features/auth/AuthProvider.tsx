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
    await sessionController.login({ username, password });
    
    if (isMountedRef.current) {
      setUser({ username });
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
    const username = tokenStorage.getUsername();

    if (!access) {
      setUser(null);
      return false;
    }

    if (isMountedRef.current) {
      setUser({ username: username ?? "" });
    }
    return true;
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
