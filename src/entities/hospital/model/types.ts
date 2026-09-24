import type { Rfc3339DateTime, UUID } from "@/shared/api/types";

export type Hospital = {
  id: UUID;
  name: string;
  description: string;
  address: string;
  phone: string;
  facility_type_id: UUID;
  latitude: number;
  longitude: number;
  created_at: Rfc3339DateTime;
  updated_at: Rfc3339DateTime;
};

export type LinkedHospital = Pick<
  Hospital,
  "id" | "name" | "description" | "address" | "phone" | "created_at" | "updated_at"
>;

export type CreateHospitalRequest = {
  name: string;
  description?: string;
  address: string;
  phone?: string;
  facility_type_id: UUID;
  latitude?: number;
  longitude?: number;
};

/** PATCH replaces omitted DTO fields with zero values, so updates must be complete. */
export type UpdateHospitalRequest = {
  name: string;
  description: string;
  address: string;
  phone: string;
  facility_type_id: UUID;
  latitude: number;
  longitude: number;
};
