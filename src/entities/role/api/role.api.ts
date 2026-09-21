import { api } from "@/shared/api/client";
import { unwrapData } from "@/shared/api/response";
import type { ApiResponse } from "@/shared/api/types";
import type { CreateRoleRequest, Role } from "../model/types";

export const roleApi = {
  create(data: CreateRoleRequest): Promise<Role> {
    return unwrapData(api().post<ApiResponse<Role>>("/role/", data));
  },

  list(): Promise<Role[]> {
    return unwrapData(api().get<ApiResponse<Role[]>>("/role/"));
  },
};
