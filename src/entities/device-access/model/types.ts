import type { Rfc3339DateTime } from "@/shared/api/types";

export type DeviceAccessTokens = {
  access_token: string;
  refresh_token: string;
  /** End of the device shift, not the access-token expiration time. */
  expires_at: Rfc3339DateTime;
};

export type DeviceAccessLoginRequest = {
  device_id: string;
  auth_secret: string;
  car_number: string;
};

export type DeviceAccessRefreshRequest = {
  refresh_token: string;
};

export type DeviceAccessLogoutRequest = DeviceAccessRefreshRequest;
