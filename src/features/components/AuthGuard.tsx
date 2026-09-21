'use client';

import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '../auth/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
  fallback?: React.ReactNode;
  className?: string; // добавили
}

export function AuthGuard({ 
  children, 
  requireAuth = true, 
  redirectTo = '/',
  fallback,
  className // добавили
}: AuthGuardProps) {
  const { isAuth, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (requireAuth && !isAuth) {
        router.replace(redirectTo);
      }
      if (!requireAuth && isAuth) {
        router.replace(redirectTo);
      }
    }
  }, [isAuth, isLoading, requireAuth, redirectTo, router]);

  if (isLoading) {
    return fallback ? <>{fallback}</> : (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner className="size-12" />
      </div>
    );
  }

  const shouldShow = requireAuth ? isAuth : !isAuth;
  
  if (!shouldShow) {
    return null;
  }

  return (
    <div className={cn("flex flex-col flex-1", className)}>
      {children}
    </div>
  );
}
