import { api } from "@/shared/api/client";
import { pathSegment, unwrapData } from "@/shared/api/response";
import type { ApiResponse, UUID } from "@/shared/api/types";
import type {
  CreateFacilityTypeRequest,
  FacilityType,
  UpdateFacilityTypeRequest,
} from "../model/types";

const unwrapOptionalData = <T>(
  request: Promise<ApiResponse<T> | undefined>,
): Promise<T | undefined> => request.then((response) => response?.data);

export const facilityTypeApi = {
  create(data: CreateFacilityTypeRequest): Promise<FacilityType> {
    return unwrapData(
      api().post<ApiResponse<FacilityType>>("/facility-type/", data),
    );
  },

  list(): Promise<FacilityType[] | undefined> {
    return unwrapOptionalData(
      api().get<ApiResponse<FacilityType[]> | undefined>("/facility-type/"),
    );
  },

  getById(id: UUID): Promise<FacilityType | undefined> {
    return unwrapOptionalData(
      api().get<ApiResponse<FacilityType> | undefined>(
        `/facility-type/${pathSegment(id)}`,
      ),
    );
  },

  getByCode(code: string): Promise<FacilityType | undefined> {
    return unwrapOptionalData(
      api().get<ApiResponse<FacilityType> | undefined>(
        `/facility-type/code/${pathSegment(code)}`,
      ),
    );
  },

  getByName(name: string): Promise<FacilityType | undefined> {
    return unwrapOptionalData(
      api().get<ApiResponse<FacilityType> | undefined>(
        `/facility-type/name/${pathSegment(name)}`,
      ),
    );
  },

  update(
    id: UUID,
    data: UpdateFacilityTypeRequest,
  ): Promise<FacilityType | undefined> {
    return unwrapOptionalData(
      api().patch<ApiResponse<FacilityType> | undefined>(
        `/facility-type/${pathSegment(id)}`,
        data,
      ),
    );
  },

  delete(id: UUID): Promise<null | undefined> {
    return unwrapOptionalData(
      api().del<ApiResponse<null> | undefined>(
        `/facility-type/${pathSegment(id)}`,
      ),
    );
  },
};
