import { api } from "@/shared/api/client";
import { pathSegment, unwrapData } from "@/shared/api/response";
import type { ApiResponse, EmptyResponse, UUID } from "@/shared/api/types";
import type {
  CreateHospitalServiceAreaRequest,
  HospitalServiceArea,
  UpdateHospitalServiceAreaRequest,
} from "../model/types";

const serviceAreaPath = (id: UUID) =>
  `/hospital-service-areas/${pathSegment(id)}`;

export const hospitalServiceAreaApi = {
  create(data: CreateHospitalServiceAreaRequest): Promise<HospitalServiceArea> {
    return unwrapData(
      api().post<ApiResponse<HospitalServiceArea>>(
        "/hospital-service-areas/",
        data,
      ),
    );
  },

  list(): Promise<HospitalServiceArea[]> {
    return unwrapData(
      api().get<ApiResponse<HospitalServiceArea[]>>(
        "/hospital-service-areas/",
      ),
    );
  },

  getById(id: UUID): Promise<HospitalServiceArea> {
    return unwrapData(
      api().get<ApiResponse<HospitalServiceArea>>(serviceAreaPath(id)),
    );
  },

  update(
    id: UUID,
    data: UpdateHospitalServiceAreaRequest,
  ): Promise<HospitalServiceArea> {
    return unwrapData(
      api().put<ApiResponse<HospitalServiceArea>>(serviceAreaPath(id), data),
    );
  },

  delete(id: UUID): Promise<EmptyResponse> {
    return api().del<EmptyResponse>(serviceAreaPath(id));
  },
};
