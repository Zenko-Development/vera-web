import { tokenStorage } from "@/shared/lib/storage";
import { authApi } from "../api/auth";
import type { AuthTokens } from "../model/types";

function saveTokens(tokens: AuthTokens): void {
  tokenStorage.setAccess(tokens.access_token);
  tokenStorage.setRefresh(tokens.refresh_token);
}

export const sessionController = {
  async login(credentials: { username: string; password: string }): Promise<void> {
    const tokens = await authApi.login({
      user_name: credentials.username,
      password: credentials.password,
      device_id: tokenStorage.getOrCreateDeviceId(),
    });

    saveTokens(tokens);
    tokenStorage.setUsername(credentials.username);
  },

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
