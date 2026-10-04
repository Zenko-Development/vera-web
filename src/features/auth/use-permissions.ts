"use client";

import { useCallback, useMemo } from "react";
import { useAuth } from "./useAuth";
import { hasAllPermissions, hasAnyPermission, hasPermission } from "./access-control";

export function usePermissions() {
  const { user } = useAuth();
  const permissions = useMemo(() => user?.permissions ?? [], [user?.permissions]);

  return {
    permissions,
    can: useCallback(
      (permission: string) => hasPermission(permissions, permission),
      [permissions],
    ),
    canAny: useCallback(
      (required: readonly string[]) => hasAnyPermission(permissions, required),
      [permissions],
    ),
    canAll: useCallback(
      (required: readonly string[]) => hasAllPermissions(permissions, required),
      [permissions],
    ),
  };
}
