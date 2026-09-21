import type { Rfc3339DateTime, UUID } from "@/shared/api/types";

export type Sickness = {
  id: UUID;
  name: string;
  description: string;
  updated_at: Rfc3339DateTime;
  created_at: Rfc3339DateTime;
};

export type CreateSicknessRequest = {
  name: string;
  description?: string;
};

export type UpdateSicknessRequest = {
  name: string;
  description: string;
};
