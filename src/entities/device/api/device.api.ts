import { api } from "@/shared/api/client";
import { pathSegment, unwrapData } from "@/shared/api/response";
import type { ApiResponse } from "@/shared/api/types";
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
};
