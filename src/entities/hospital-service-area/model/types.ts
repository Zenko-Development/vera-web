import type { Rfc3339DateTime, UUID } from "@/shared/api/types";

/** WGS 84 point represented by the backend as [latitude, longitude]. */
export type ServiceAreaPoint = [latitude: number, longitude: number];

export type HospitalServiceArea = {
  id: UUID;
  hospital_id: UUID;
  name: string;
  boundary: ServiceAreaPoint[];
  priority: number;
  active: boolean;
  created_at: Rfc3339DateTime;
  updated_at: Rfc3339DateTime;
};

export type HospitalServiceAreaRequest = Pick<
  HospitalServiceArea,
  "hospital_id" | "name" | "boundary" | "priority" | "active"
>;

export type CreateHospitalServiceAreaRequest = HospitalServiceAreaRequest;
export type UpdateHospitalServiceAreaRequest = HospitalServiceAreaRequest;
