import type { Rfc3339DateTime } from "@/shared/api/types";

export type GeoTrackingPolicy = {
  active_call_interval_seconds: number;
  max_accuracy_meters: number;
  location_freshness_seconds: number;
  eta_average_speed_kmh: number;
  eta_road_distance_factor: number;
  updated_at: Rfc3339DateTime;
};

export type UpdateGeoTrackingPolicyRequest = Partial<
  Omit<GeoTrackingPolicy, "updated_at">
>;
