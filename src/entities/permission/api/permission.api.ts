import { api } from "@/shared/api/client";
import { pathSegment, unwrapData } from "@/shared/api/response";
import type { ApiResponse, EmptyResponse, UUID } from "@/shared/api/types";
import type { CreatePermissionRequest, Permission } from "../model/types";

export const permissionApi = {
  create(data: CreatePermissionRequest): Promise<Permission> {
    return unwrapData(api().post<ApiResponse<Permission>>("/permission/", data));
  },

  list(): Promise<Permission[]> {
    return unwrapData(api().get<ApiResponse<Permission[]>>("/permission/"));
  },

  getById(id: UUID): Promise<Permission> {
    return unwrapData(
      api().get<ApiResponse<Permission>>(`/permission/${pathSegment(id)}`),
    );
  },

  getByName(name: string): Promise<Permission> {
    return unwrapData(
      api().get<ApiResponse<Permission>>(`/permission/name/${pathSegment(name)}`),
    );
  },

  delete(id: UUID): Promise<EmptyResponse> {
    return api().del<EmptyResponse>(`/permission/${pathSegment(id)}`);
  },
};
