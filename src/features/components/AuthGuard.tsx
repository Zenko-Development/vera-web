'use client';

import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '../auth/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { getDefaultAppPath, hasAllPermissions, hasAnyPermission } from '@/features/auth/access-control';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
  fallback?: React.ReactNode;
  className?: string; // добавили
  permissions?: readonly string[];
  permissionMode?: 'any' | 'all';
}

export function AuthGuard({ 
  children, 
  requireAuth = true, 
  redirectTo = '/',
  fallback,
  className, // добавили
  permissions,
  permissionMode = 'any',
}: AuthGuardProps) {
  const { isAuth, isLoading, user } = useAuth();
  const router = useRouter();
  const hasRequiredAccess = !permissions?.length || (
    permissionMode === 'all'
      ? hasAllPermissions(user?.permissions, permissions)
      : hasAnyPermission(user?.permissions, permissions)
  );

  useEffect(() => {
    if (!isLoading) {
      if (requireAuth && !isAuth) {
        router.replace(redirectTo);
      }
      if (!requireAuth && isAuth) {
        router.replace(redirectTo);
      }
      if (requireAuth && isAuth && !hasRequiredAccess) {
        router.replace(getDefaultAppPath(user?.permissions));
      }
    }
  }, [hasRequiredAccess, isAuth, isLoading, requireAuth, redirectTo, router, user?.permissions]);

  if (isLoading) {
    return fallback ? <>{fallback}</> : (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner className="size-12" />
      </div>
    );
  }

  const shouldShow = (requireAuth ? isAuth : !isAuth) && hasRequiredAccess;
  
  if (!shouldShow) {
    return null;
  }

  return (
    <div className={cn("flex flex-col flex-1", className)}>
      {children}
    </div>
  );
}
