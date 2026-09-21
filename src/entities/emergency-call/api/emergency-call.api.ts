import { api } from "@/shared/api/client";
import { pathSegment, unwrapData } from "@/shared/api/response";
import type { ApiResponse, UUID } from "@/shared/api/types";
import type { EmergencyCall } from "../model/types";

const callPath = (id: UUID) => `/emergency-calls/${pathSegment(id)}`;
const deviceAuth = { auth: true } as const;

export const emergencyCallApi = {
  create(): Promise<EmergencyCall> {
    return unwrapData(
      api().post<ApiResponse<EmergencyCall>>(
        "/emergency-calls/",
        undefined,
        deviceAuth,
      ),
    );
  },

  getActive(): Promise<EmergencyCall> {
    return unwrapData(
      api().get<ApiResponse<EmergencyCall>>(
        "/emergency-calls/active",
        deviceAuth,
      ),
    );
  },

  getById(id: UUID): Promise<EmergencyCall> {
    return unwrapData(
      api().get<ApiResponse<EmergencyCall>>(callPath(id), deviceAuth),
    );
  },

  complete(id: UUID): Promise<EmergencyCall> {
    return unwrapData(
      api().post<ApiResponse<EmergencyCall>>(
        `${callPath(id)}/complete`,
        undefined,
        deviceAuth,
      ),
    );
  },

  cancel(id: UUID): Promise<EmergencyCall> {
    return unwrapData(
      api().post<ApiResponse<EmergencyCall>>(
        `${callPath(id)}/cancel`,
        undefined,
        deviceAuth,
      ),
    );
  },
};
