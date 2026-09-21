import type { Rfc3339DateTime, UUID } from "@/shared/api/types";

export type FacilityType = {
  id: UUID;
  name: string;
  code: string;
  description: string;
  created_at: Rfc3339DateTime;
  updated_at: Rfc3339DateTime;
};

export type CreateFacilityTypeRequest = {
  name: string;
  code: string;
  description?: string;
};

export type UpdateFacilityTypeRequest = {
  name: string;
  code: string;
  description: string;
};
