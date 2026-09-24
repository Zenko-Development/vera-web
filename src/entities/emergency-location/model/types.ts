import type { Rfc3339DateTime, UUID } from "@/shared/api/types";

export type EmergencyLocation = {
  id: UUID;
  emergency_call_id: UUID;
  latitude: number;
  longitude: number;
  accuracy_meters: number;
  captured_at: Rfc3339DateTime;
  received_at: Rfc3339DateTime;
  is_fresh: boolean;
  age_seconds: number;
};

export type CreateEmergencyLocationRequest = Pick<
  EmergencyLocation,
  "latitude" | "longitude" | "accuracy_meters" | "captured_at"
>;
