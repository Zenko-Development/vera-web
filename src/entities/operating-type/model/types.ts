import type { Rfc3339DateTime, UUID } from "@/shared/api/types";

export type OperatingType = {
  id: UUID;
  name: string;
  description: string;
  created_at: Rfc3339DateTime;
  updated_at: Rfc3339DateTime;
};

export type CreateOperatingTypeRequest = Pick<
  OperatingType,
  "name" | "description"
>;
export type UpdateOperatingTypeRequest = CreateOperatingTypeRequest;
