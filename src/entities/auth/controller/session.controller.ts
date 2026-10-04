import { tokenStorage } from "@/shared/lib/storage";
import { authApi } from "../api/auth";
import type { AuthIdentity, AuthTokens } from "../model/types";

function saveTokens(tokens: AuthTokens): void {
  tokenStorage.setAccess(tokens.access_token);
  tokenStorage.setRefresh(tokens.refresh_token);
}

async function getCurrentIdentity(): Promise<AuthIdentity> {
  const profile = await authApi.me();
  tokenStorage.setUsername(profile.user.user_name);
  return {
    username: profile.user.user_name,
    user: profile.user,
    role: profile.role,
    permissions: profile.permissions,
    hospitalIds: profile.hospital_ids,
  };
}

export const sessionController = {
  async login(credentials: { username: string; password: string }): Promise<AuthIdentity> {
    const tokens = await authApi.login({
      user_name: credentials.username,
      password: credentials.password,
      device_id: tokenStorage.getOrCreateDeviceId(),
    });

    saveTokens(tokens);
    try {
      return await getCurrentIdentity();
    } catch (error) {
      tokenStorage.clear();
      throw error;
    }
  },

  getCurrentIdentity,

  async refresh(): Promise<AuthTokens | null> {
    const refreshToken = tokenStorage.getRefresh();
    if (!refreshToken) return null;

    const tokens = await authApi.refresh({ refresh_token: refreshToken });
    saveTokens(tokens);
    return tokens;
  },

  async logout(): Promise<void> {
    const refreshToken = tokenStorage.getRefresh();

    try {
      if (refreshToken) {
        await authApi.logout({ refresh_token: refreshToken });
      }
    } finally {
      tokenStorage.clear();
    }
  },
};
