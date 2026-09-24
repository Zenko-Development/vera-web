import { api } from "@/shared/api/client";
import { pathSegment, unwrapData } from "@/shared/api/response";
import type { ApiResponse, UUID } from "@/shared/api/types";
import type {
  CreateUserRequest,
  UpdateUserAccessStatusRequest,
  UpdateUserRoleRequest,
  User,
} from "../model/types";

export const userApi = {
  list(): Promise<User[]> {
    return unwrapData(api().get<ApiResponse<User[]>>("/user/"));
  },

  create(data: CreateUserRequest): Promise<User> {
    return unwrapData(api().post<ApiResponse<User>>("/user/", data));
  },

  getById(id: UUID): Promise<User> {
    return unwrapData(api().get<ApiResponse<User>>(`/user/${pathSegment(id)}`));
  },

  getByUsername(username: string): Promise<User> {
    return unwrapData(
      api().get<ApiResponse<User>>(`/user/name/${pathSegment(username)}`),
    );
  },

  updateAccessStatus(
    id: UUID,
    data: UpdateUserAccessStatusRequest,
  ): Promise<User> {
    return unwrapData(
      api().patch<ApiResponse<User>>(`/user/status/${pathSegment(id)}`, data),
    );
  },

  updateRole(id: UUID, data: UpdateUserRoleRequest): Promise<User> {
    return unwrapData(
      api().patch<ApiResponse<User>>(`/user/${pathSegment(id)}/role`, data),
    );
  },
};
