import type { Permission } from "@/entities/permission/model/types";
import type { RoleWithDates } from "@/entities/role/model/types";
import { api } from "@/shared/api/client";
import { pathSegment, unwrapData } from "@/shared/api/response";
import type { ApiResponse, EmptyResponse, UUID } from "@/shared/api/types";
import type { RolePermission } from "../model/types";

const relationPath = (roleId: UUID, permissionId: UUID) =>
  `/link/role/${pathSegment(roleId)}/permission/${pathSegment(permissionId)}`;

export const rolePermissionApi = {
  assign(roleId: UUID, permissionId: UUID): Promise<RolePermission> {
    return unwrapData(
      api().post<ApiResponse<RolePermission>>(relationPath(roleId, permissionId)),
    );
  },

  revoke(roleId: UUID, permissionId: UUID): Promise<EmptyResponse> {
    return api().del<EmptyResponse>(relationPath(roleId, permissionId));
  },

  listPermissions(roleId: UUID): Promise<Permission[]> {
    return unwrapData(
      api().get<ApiResponse<Permission[]>>(
        `/link/role/${pathSegment(roleId)}/permission`,
      ),
    );
  },

  listRoles(permissionId: UUID): Promise<RoleWithDates[]> {
    return unwrapData(
      api().get<ApiResponse<RoleWithDates[]>>(
        `/link/permission/${pathSegment(permissionId)}/roles`,
      ),
    );
  },
};
