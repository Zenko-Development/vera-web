import { api } from "@/shared/api/client";
import { pathSegment, unwrapData } from "@/shared/api/response";
import type { ApiResponse, EmptyResponse, UUID } from "@/shared/api/types";
import type {
  CreateSicknessRequest,
  Sickness,
  UpdateSicknessRequest,
} from "../model/types";

export const sicknessApi = {
  create(data: CreateSicknessRequest): Promise<Sickness> {
    return unwrapData(api().post<ApiResponse<Sickness>>("/sickness/", data));
  },

  list(): Promise<Sickness[]> {
    return unwrapData(api().get<ApiResponse<Sickness[]>>("/sickness/"));
  },

  getById(id: UUID): Promise<Sickness> {
    return unwrapData(
      api().get<ApiResponse<Sickness>>(`/sickness/${pathSegment(id)}`),
    );
  },

  getByName(name: string): Promise<Sickness> {
    return unwrapData(
      api().get<ApiResponse<Sickness>>(`/sickness/name/${pathSegment(name)}`),
    );
  },

  update(id: UUID, data: UpdateSicknessRequest): Promise<Sickness> {
    return unwrapData(
      api().patch<ApiResponse<Sickness>>(`/sickness/${pathSegment(id)}`, data),
    );
  },

  delete(id: UUID): Promise<EmptyResponse> {
    return api().del<EmptyResponse>(`/sickness/${pathSegment(id)}`);
  },
};
