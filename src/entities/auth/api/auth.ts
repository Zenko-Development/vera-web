// entities/auth/api/auth.api.ts

import type {
  LoginRequest,
  LoginResponse,
  RefreshResponse,
  LogoutResponse,
} from "../model/types";

const mockUser = {
  id: "1",
  username: "admin",
  role: "student" as const,
};

const mockTokens = {
  accessToken: "mock-access-token",
  refreshToken: "mock-refresh-token",
};

// Правильные данные для входа
const VALID_CREDENTIALS = {
  username: "admin",
  password: "admin123",
};

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    // Проверяем логин и пароль
    if (data.username !== VALID_CREDENTIALS.username || data.password !== VALID_CREDENTIALS.password) {
      throw new Error("Неверное имя пользователя или пароль");
    }
    
    return {
      ...mockTokens,
      user: mockUser,
    };
  },

  refresh: async (): Promise<RefreshResponse> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      ...mockTokens,
      user: mockUser,
    };
  },

  logout: async (): Promise<LogoutResponse> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return {};
  },
};