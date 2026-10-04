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
  user: {
    id: string;
    user_name: string;
    name_first: string;
    name_middle: string;
    name_last: string;
    acces_status: boolean;
    role_id: string;
  };
  role: {
    id: string;
    name: string;
  };
  permissions: string[];
  hospitalIds: string[];
};

export type AuthMeResponse = {
  user: AuthIdentity["user"];
  role: AuthIdentity["role"];
  permissions: string[];
  hospital_ids: string[];
};
