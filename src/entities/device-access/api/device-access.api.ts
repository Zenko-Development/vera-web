import { api } from "@/shared/api/client";
import { unwrapData } from "@/shared/api/response";
import type { ApiResponse, EmptyResponse } from "@/shared/api/types";
import type {
  DeviceAccessLoginRequest,
  DeviceAccessLogoutRequest,
  DeviceAccessRefreshRequest,
  DeviceAccessTokens,
} from "../model/types";

const publicRequest = { auth: false } as const;

export const deviceAccessApi = {
  login(data: DeviceAccessLoginRequest): Promise<DeviceAccessTokens> {
    return unwrapData(
      api().post<ApiResponse<DeviceAccessTokens>>(
        "/device-access/login",
        data,
        publicRequest,
      ),
    );
  },

  refresh(data: DeviceAccessRefreshRequest): Promise<DeviceAccessTokens> {
    return unwrapData(
      api().post<ApiResponse<DeviceAccessTokens>>(
        "/device-access/refresh",
        data,
        publicRequest,
      ),
    );
  },

  logout(data: DeviceAccessLogoutRequest): Promise<EmptyResponse> {
    return api().post<EmptyResponse>("/device-access/logout", data);
  },
};
