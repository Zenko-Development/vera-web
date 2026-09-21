import { api } from "@/shared/api/client";
import { pathSegment, unwrapData } from "@/shared/api/response";
import type { ApiResponse, UUID } from "@/shared/api/types";
import type {
  CreateEmergencyLocationRequest,
  EmergencyLocation,
} from "../model/types";

const callPath = (callId: UUID) =>
  `/emergency-calls/${pathSegment(callId)}`;
const deviceAuth = { auth: true } as const;

export const emergencyLocationApi = {
  create(
    callId: UUID,
    data: CreateEmergencyLocationRequest,
  ): Promise<EmergencyLocation> {
    return unwrapData(
      api().post<ApiResponse<EmergencyLocation>>(
        `${callPath(callId)}/locations`,
        data,
        deviceAuth,
      ),
    );
  },

  getLatest(callId: UUID): Promise<EmergencyLocation> {
    return unwrapData(
      api().get<ApiResponse<EmergencyLocation>>(
        `${callPath(callId)}/location`,
        deviceAuth,
      ),
    );
  },
};
