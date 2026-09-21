import { api } from "@/shared/api/client";
import { pathSegment, unwrapData } from "@/shared/api/response";
import type { ApiResponse, UUID } from "@/shared/api/types";
import type {
  EmergencyDestination,
  SelectEmergencyDestinationRequest,
} from "../model/types";

const destinationPath = (callId: UUID) =>
  `/emergency-calls/${pathSegment(callId)}/destination`;
const deviceAuth = { auth: true } as const;

export const emergencyDestinationApi = {
  resolve(callId: UUID): Promise<EmergencyDestination> {
    return unwrapData(
      api().post<ApiResponse<EmergencyDestination>>(
        `${destinationPath(callId)}/resolve`,
        undefined,
        deviceAuth,
      ),
    );
  },

  get(callId: UUID): Promise<EmergencyDestination> {
    return unwrapData(
      api().get<ApiResponse<EmergencyDestination>>(
        destinationPath(callId),
        deviceAuth,
      ),
    );
  },

  select(
    callId: UUID,
    data: SelectEmergencyDestinationRequest,
  ): Promise<EmergencyDestination> {
    return unwrapData(
      api().post<ApiResponse<EmergencyDestination>>(
        `${destinationPath(callId)}/select`,
        data,
        deviceAuth,
      ),
    );
  },
};
