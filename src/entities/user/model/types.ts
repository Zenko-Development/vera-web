import type { UUID } from "@/shared/api/types";

export type User = {
  id: UUID;
  user_name: string;
  name_first: string;
  name_middle: string;
  name_last: string;
  acces_status: boolean;
  role_id: UUID;
};

export type CreateUserRequest = {
  user_name: string;
  name_first: string;
  name_middle?: string;
  name_last: string;
  acces_status: boolean;
  role_id: UUID;
  password: string;
};

export type UpdateUserAccessStatusRequest = Pick<User, "acces_status">;

export type UpdateUserRoleRequest = Pick<User, "role_id">;

export type UpdateUserRequest = Partial<
  Pick<User, "user_name" | "name_first" | "name_middle" | "name_last">
>;

export type ResetUserPasswordRequest = {
  new_password: string;
};
