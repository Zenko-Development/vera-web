import type { Rfc3339DateTime, UUID } from "@/shared/api/types";

export type Permission = {
  id: UUID;
  name: string;
  description: string;
  updated_at: Rfc3339DateTime;
  created_at: Rfc3339DateTime;
};

export type CreatePermissionRequest = {
  name: string;
  description?: string;
};
