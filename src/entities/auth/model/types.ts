// entities/auth/model/types.ts

export type User = {
  id: string;
  username: string;
  role: 'student' | 'parent';
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type LoginRequest = {
  id: string; // username
  password: string;
};

export type LoginResponse = AuthTokens & {
  user: User;
};

export type RegisterRequest = {
  username: string;
  password: string;
  role: 'student' | 'parent';
};

export type RegisterResponse = AuthTokens & {
  user: User;
};

export type RefreshRequest = {
  refreshToken?: string;
};

export type RefreshResponse = AuthTokens & {
  user: User;
};

export type LogoutRequest = {
  refreshToken?: string;
};

export type LogoutResponse = Record<string, never>;