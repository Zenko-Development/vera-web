import { api } from "@/shared/api/client";
import { pathSegment, unwrapData } from "@/shared/api/response";
import type { ApiResponse, EmptyResponse } from "@/shared/api/types";
import type { Device, DeviceCredentials } from "../model/types";

export const deviceApi = {
  create(): Promise<DeviceCredentials> {
    return unwrapData(api().post<ApiResponse<DeviceCredentials>>("/device/"));
  },

  list(): Promise<Device[]> {
    return unwrapData(api().get<ApiResponse<Device[]>>("/device/"));
  },

  getByDeviceId(deviceId: string): Promise<Device> {
    return unwrapData(
      api().get<ApiResponse<Device>>(`/device/${pathSegment(deviceId)}`),
    );
  },

  resetAuthSecret(deviceId: string): Promise<DeviceCredentials> {
    return unwrapData(
      api().post<ApiResponse<DeviceCredentials>>(
        `/device/${pathSegment(deviceId)}/auth-secret`,
      ),
    );
  },

  disable(deviceId: string): Promise<Device> {
    return unwrapData(
      api().patch<ApiResponse<Device>>(
        `/device/${pathSegment(deviceId)}/status`,
        { status: "inactive" },
      ),
    );
  },

  delete(deviceId: string): Promise<EmptyResponse> {
    return api().del<EmptyResponse>(`/device/${pathSegment(deviceId)}`);
  },
};
