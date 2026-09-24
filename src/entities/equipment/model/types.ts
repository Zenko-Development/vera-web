import type { Rfc3339DateTime, UUID } from "@/shared/api/types";

export type Equipment = {
  id: UUID;
  name: string;
  description: string;
  created_at: Rfc3339DateTime;
  updated_at: Rfc3339DateTime;
};

export type CreateEquipmentRequest = Pick<Equipment, "name" | "description">;
export type UpdateEquipmentRequest = CreateEquipmentRequest;
