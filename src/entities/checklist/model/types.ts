import type { Rfc3339DateTime, UUID } from "@/shared/api/types";

export type Checklist = {
  id: UUID;
  name: string;
  description: string;
  sickness_id: UUID;
  created_at: Rfc3339DateTime;
  updated_at: Rfc3339DateTime;
};

export type CreateChecklistRequest = {
  name: string;
  description?: string;
  sickness_id: UUID;
};

export type UpdateChecklistRequest = {
  name: string;
  description: string;
  sickness_id: UUID;
};
