import { api } from "@/shared/api/client";
import { pathSegment, unwrapData } from "@/shared/api/response";
import type { ApiResponse, EmptyResponse, UUID } from "@/shared/api/types";
import type { CreateRoleRequest, Role, UpdateRoleRequest } from "../model/types";

export const roleApi = {
  create(data: CreateRoleRequest): Promise<Role> {
    return unwrapData(api().post<ApiResponse<Role>>("/role/", data));
  },

  list(): Promise<Role[]> {
    return unwrapData(api().get<ApiResponse<Role[]>>("/role/"));
  },

  update(id: UUID, data: UpdateRoleRequest): Promise<Role> {
    return unwrapData(
      api().patch<ApiResponse<Role>>(`/role/${pathSegment(id)}`, data),
    );
  },

  delete(id: UUID): Promise<EmptyResponse> {
    return api().del<EmptyResponse>(`/role/${pathSegment(id)}`);
  },
};
