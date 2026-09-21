import type { Rfc3339DateTime, UUID } from "@/shared/api/types";

export type HospitalSickness = {
  id: UUID;
  sickness_id: UUID;
  hospital_id: UUID;
  update_at: Rfc3339DateTime;
  created_at: Rfc3339DateTime;
};
