import { api } from "@/shared/api/client";
import { pathSegment, unwrapData } from "@/shared/api/response";
import type { ApiResponse, EmptyResponse, UUID } from "@/shared/api/types";
import type {
  CreateUserRequest,
  UpdateUserAccessStatusRequest,
  ResetUserPasswordRequest,
  UpdateUserRoleRequest,
  UpdateUserRequest,
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

  update(id: UUID, data: UpdateUserRequest): Promise<User> {
    return unwrapData(
      api().patch<ApiResponse<User>>(`/user/${pathSegment(id)}`, data),
    );
  },

  resetPassword(id: UUID, data: ResetUserPasswordRequest): Promise<EmptyResponse> {
    return api().post<EmptyResponse>(
      `/user/${pathSegment(id)}/password-reset`,
      data,
    );
  },

  delete(id: UUID): Promise<EmptyResponse> {
    return api().del<EmptyResponse>(`/user/${pathSegment(id)}`);
  },
};
