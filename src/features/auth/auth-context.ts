// features/auth/auth-context.ts
'use client';

import { createContext } from 'react';
import type { User } from '@/entities/auth/model/types';

interface AuthContextValue {
  user: User | null;
  isAuth: boolean;
  isLoading: boolean;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);