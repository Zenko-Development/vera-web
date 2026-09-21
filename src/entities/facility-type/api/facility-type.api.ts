import { api } from "@/shared/api/client";
import { pathSegment, unwrapData } from "@/shared/api/response";
import type { ApiResponse, UUID } from "@/shared/api/types";
import type {
  CreateFacilityTypeRequest,
  FacilityType,
  UpdateFacilityTypeRequest,
} from "../model/types";

export const facilityTypeApi = {
  create(data: CreateFacilityTypeRequest): Promise<FacilityType> {
    return unwrapData(
      api().post<ApiResponse<FacilityType>>("/facility-type/", data),
    );
  },

  list(): Promise<FacilityType[] | undefined> {
    return unwrapData(api().get<ApiResponse<FacilityType[]>>("/facility-type/"));
  },

  getById(id: UUID): Promise<FacilityType | undefined> {
    return unwrapData(
      api().get<ApiResponse<FacilityType>>(`/facility-type/${pathSegment(id)}`),
    );
  },

  getByCode(code: string): Promise<FacilityType | undefined> {
    return unwrapData(
      api().get<ApiResponse<FacilityType>>(
        `/facility-type/code/${pathSegment(code)}`,
      ),
    );
  },

  getByName(name: string): Promise<FacilityType | undefined> {
    return unwrapData(
      api().get<ApiResponse<FacilityType>>(
        `/facility-type/name/${pathSegment(name)}`,
      ),
    );
  },

  update(
    id: UUID,
    data: UpdateFacilityTypeRequest,
  ): Promise<FacilityType | undefined> {
    return unwrapData(
      api().patch<ApiResponse<FacilityType>>(
        `/facility-type/${pathSegment(id)}`,
        data,
      ),
    );
  },

  delete(id: UUID): Promise<null | undefined> {
    return unwrapData(
      api().del<ApiResponse<null>>(`/facility-type/${pathSegment(id)}`),
    );
  },
};
