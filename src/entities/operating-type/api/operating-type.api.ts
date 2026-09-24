import { api } from "@/shared/api/client";
import { pathSegment, unwrapData } from "@/shared/api/response";
import type { ApiResponse, EmptyResponse, UUID } from "@/shared/api/types";
import type {
  CreateOperatingTypeRequest,
  OperatingType,
  UpdateOperatingTypeRequest,
} from "../model/types";

const operatingTypePath = (id: UUID) =>
  `/operating-types/${pathSegment(id)}`;

export const operatingTypeApi = {
  create(data: CreateOperatingTypeRequest): Promise<OperatingType> {
    return unwrapData(
      api().post<ApiResponse<OperatingType>>("/operating-types/", data),
    );
  },

  list(): Promise<OperatingType[]> {
    return unwrapData(
      api().get<ApiResponse<OperatingType[]>>("/operating-types/"),
    );
  },

  getById(id: UUID): Promise<OperatingType> {
    return unwrapData(
      api().get<ApiResponse<OperatingType>>(operatingTypePath(id)),
    );
  },

  update(
    id: UUID,
    data: UpdateOperatingTypeRequest,
  ): Promise<OperatingType> {
    return unwrapData(
      api().put<ApiResponse<OperatingType>>(operatingTypePath(id), data),
    );
  },

  delete(id: UUID): Promise<EmptyResponse> {
    return api().del<EmptyResponse>(operatingTypePath(id));
  },
};
