import type { Rfc3339DateTime, UUID } from "@/shared/api/types";

export type FleetLiveVehicle = {
  vehicle_id: UUID;
  car_number: string;
  device_id: string;
  session_id: UUID;
  latitude?: number;
  longitude?: number;
  accuracy_meters?: number;
  captured_at?: Rfc3339DateTime;
  received_at?: Rfc3339DateTime;
  emergency_call_id?: UUID;
  location_is_fresh: boolean;
  location_age_seconds?: number;
};
