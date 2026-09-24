import { api } from "@/shared/api/client";
import { unwrapData } from "@/shared/api/response";
import type { ApiResponse } from "@/shared/api/types";
import type {
  GeoTrackingPolicy,
  UpdateGeoTrackingPolicyRequest,
} from "../model/types";

const policyPath = "/geo-tracking-policy/";

export const geoTrackingPolicyApi = {
  getForDevice(): Promise<GeoTrackingPolicy> {
    return unwrapData(
      api().get<ApiResponse<GeoTrackingPolicy>>(
        "/device/geo-tracking-policy",
        { auth: true },
      ),
    );
  },

  get(): Promise<GeoTrackingPolicy> {
    return unwrapData(api().get<ApiResponse<GeoTrackingPolicy>>(policyPath));
  },

  update(data: UpdateGeoTrackingPolicyRequest): Promise<GeoTrackingPolicy> {
    return unwrapData(
      api().patch<ApiResponse<GeoTrackingPolicy>>(policyPath, data),
    );
  },
};
