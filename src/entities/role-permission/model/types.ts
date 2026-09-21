import type { Rfc3339DateTime, UUID } from "@/shared/api/types";

export type RolePermission = {
  role_id: UUID;
  permission_id: UUID;
  updated_at: Rfc3339DateTime;
  created_at: Rfc3339DateTime;
};
