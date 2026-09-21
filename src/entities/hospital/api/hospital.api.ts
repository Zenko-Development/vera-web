import { api } from "@/shared/api/client";
import { pathSegment, unwrapData } from "@/shared/api/response";
import type { ApiResponse, EmptyResponse, UUID } from "@/shared/api/types";
import type {
  CreateHospitalRequest,
  Hospital,
  UpdateHospitalRequest,
} from "../model/types";

export const hospitalApi = {
  create(data: CreateHospitalRequest): Promise<Hospital> {
    return unwrapData(api().post<ApiResponse<Hospital>>("/hospital/", data));
  },

  list(): Promise<Hospital[]> {
    return unwrapData(api().get<ApiResponse<Hospital[]>>("/hospital/"));
  },

  getById(id: UUID): Promise<Hospital> {
    return unwrapData(
      api().get<ApiResponse<Hospital>>(`/hospital/${pathSegment(id)}`),
    );
  },

  getByName(name: string): Promise<Hospital> {
    return unwrapData(
      api().get<ApiResponse<Hospital>>(`/hospital/name/${pathSegment(name)}`),
    );
  },

  update(id: UUID, data: UpdateHospitalRequest): Promise<Hospital> {
    return unwrapData(
      api().patch<ApiResponse<Hospital>>(`/hospital/${pathSegment(id)}`, data),
    );
  },

  delete(id: UUID): Promise<EmptyResponse> {
    return api().del<EmptyResponse>(`/hospital/${pathSegment(id)}`);
  },
};
