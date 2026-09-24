import type { Rfc3339DateTime, UUID } from "@/shared/api/types";

export type HospitalArrival = {
  emergency_call_id: UUID;
  emergency_call_destination_id: UUID;
  hospital_id: UUID;
  hospital_name: string;
  hospital_address: string;
  vehicle_id: UUID;
  car_number: string;
  location_captured_at: Rfc3339DateTime;
  location_accuracy_meters: number;
  location_is_fresh: boolean;
  location_age_seconds: number;
  distance_meters: number;
  estimated_travel_seconds: number;
  estimated_arrival_at: Rfc3339DateTime;
  calculation_method: "haversine_adjusted";
  calculated_at: Rfc3339DateTime;
  updated_at: Rfc3339DateTime;
};
