import type { Rfc3339DateTime, UUID } from "@/shared/api/types";

export type AmbulanceVehicleStatus = "active" | "inactive" | "maintenance";

export type AmbulanceVehicle = {
  id: UUID;
  car_number: string;
  status: AmbulanceVehicleStatus;
  created_at: Rfc3339DateTime;
  updated_at: Rfc3339DateTime;
};

export type CreateAmbulanceVehicleRequest = Pick<
  AmbulanceVehicle,
  "car_number"
>;

export type UpdateAmbulanceVehicleRequest =
  | {
      car_number: string;
      status?: AmbulanceVehicleStatus;
    }
  | {
      car_number?: string;
      status: AmbulanceVehicleStatus;
    };
