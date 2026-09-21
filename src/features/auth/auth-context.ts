// features/auth/auth-context.ts
'use client';

import { createContext } from 'react';
import type { AuthIdentity } from '@/entities/auth/model/types';

interface AuthContextValue {
  user: AuthIdentity | null;
  isAuth: boolean;
  isLoading: boolean;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
