import { api } from "@/shared/api/client";
import { pathSegment, unwrapData } from "@/shared/api/response";
import type { ApiResponse, UUID } from "@/shared/api/types";
import type {
  AnalyticsEmergencyCall,
  ListAnalyticsEmergencyCallsParams,
} from "../model/types";

const analyticsPath = "/analytics/emergency-calls";

export const analyticsEmergencyCallApi = {
  list(
    params: ListAnalyticsEmergencyCallsParams = {},
  ): Promise<AnalyticsEmergencyCall[]> {
    return unwrapData(
      api().get<ApiResponse<AnalyticsEmergencyCall[]>>(analyticsPath, {
        params,
      }),
    );
  },

  getById(id: UUID): Promise<AnalyticsEmergencyCall> {
    return unwrapData(
      api().get<ApiResponse<AnalyticsEmergencyCall>>(
        `${analyticsPath}/${pathSegment(id)}`,
      ),
    );
  },
};
