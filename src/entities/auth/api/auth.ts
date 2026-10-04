import { api } from "@/shared/api/client";
import { unwrapData } from "@/shared/api/response";
import type { ApiResponse, EmptyResponse } from "@/shared/api/types";
import type {
  AuthTokens,
  AuthMeResponse,
  LoginRequest,
  LogoutRequest,
  RefreshRequest,
} from "../model/types";

const publicRequest = { auth: false } as const;

export const authApi = {
  login(data: LoginRequest): Promise<AuthTokens> {
    return unwrapData(
      api().post<ApiResponse<AuthTokens>>("/auth/login", data, publicRequest),
    );
  },

  refresh(data: RefreshRequest): Promise<AuthTokens> {
    return unwrapData(
      api().post<ApiResponse<AuthTokens>>("/auth/refresh", data, publicRequest),
    );
  },

  logout(data: LogoutRequest): Promise<EmptyResponse> {
    return api().post<EmptyResponse>("/auth/logout", data);
  },

  me(): Promise<AuthMeResponse> {
    return unwrapData(api().get<ApiResponse<AuthMeResponse>>("/auth/me"));
  },
};
