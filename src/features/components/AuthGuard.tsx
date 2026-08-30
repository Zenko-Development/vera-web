'use client';

import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '../auth/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

export function AuthGuard({ 
  children, 
  requireAuth = true, 
  redirectTo = '/',
  fallback 
}: AuthGuardProps) {
  const { isAuth, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      // Если нужен авторизованный пользователь, но его нет
      if (requireAuth && !isAuth) {
        router.replace(redirectTo);
      }
      // Если нужен неавторизованный пользователь, но он авторизован
      if (!requireAuth && isAuth) {
        router.replace(redirectTo);
      }
    }
  }, [isAuth, isLoading, requireAuth, redirectTo, router]);

  // Показываем loader пока проверяем авторизацию
  if (isLoading) {
    return fallback ? <>{fallback}</> : (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner className="size-12" />
      </div>
    );
  }

  // Проверяем условия для показа контента
  const shouldShow = requireAuth ? isAuth : !isAuth;
  
  if (!shouldShow) {
    return null; // или можно показать 404
  }

  return <>{children}</>;
}