import type { Rfc3339DateTime, UUID } from "@/shared/api/types";

export type Role = {
  id: UUID;
  name: string;
};

export type RoleWithDates = Role & {
  updated_at: Rfc3339DateTime;
  created_at: Rfc3339DateTime;
};

export type CreateRoleRequest = {
  name: string;
};
