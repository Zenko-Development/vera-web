const ACCESS_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';
const USERNAME_KEY = 'auth_username';
const DEVICE_ID_KEY = 'device_id';

export const AUTH_FAILURE_EVENT = 'vera:auth-failure';

export const tokenStorage = {
  getAccess: () => localStorage.getItem(ACCESS_KEY),
  setAccess: (token: string) => localStorage.setItem(ACCESS_KEY, token),
  removeAccess: () => localStorage.removeItem(ACCESS_KEY),

  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  setRefresh: (token: string) => localStorage.setItem(REFRESH_KEY, token),
  removeRefresh: () => localStorage.removeItem(REFRESH_KEY),

  getUsername: () => localStorage.getItem(USERNAME_KEY),
  setUsername: (username: string) => localStorage.setItem(USERNAME_KEY, username),
  removeUsername: () => localStorage.removeItem(USERNAME_KEY),

  getOrCreateDeviceId: () => {
    const stored = localStorage.getItem(DEVICE_ID_KEY);
    if (stored) return stored;

    const id = globalThis.crypto?.randomUUID?.() ?? `web-${Date.now()}`;
    localStorage.setItem(DEVICE_ID_KEY, id);
    return id;
  },

  clear: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USERNAME_KEY);
  },
};
