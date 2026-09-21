export type AuthTokens = {
  access_token: string;
  refresh_token: string;
};

export type LoginRequest = {
  user_name: string;
  password: string;
  device_id: string;
};

export type RefreshRequest = {
  refresh_token: string;
};

export type LogoutRequest = RefreshRequest;

export type AuthIdentity = {
  username: string;
};
