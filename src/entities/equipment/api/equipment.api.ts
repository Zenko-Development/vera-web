import { api } from "@/shared/api/client";
import { pathSegment, unwrapData } from "@/shared/api/response";
import type { ApiResponse, EmptyResponse, UUID } from "@/shared/api/types";
import type {
  CreateEquipmentRequest,
  Equipment,
  UpdateEquipmentRequest,
} from "../model/types";

const equipmentPath = (id: UUID) => `/equipment/${pathSegment(id)}`;

export const equipmentApi = {
  create(data: CreateEquipmentRequest): Promise<Equipment> {
    return unwrapData(api().post<ApiResponse<Equipment>>("/equipment/", data));
  },

  list(): Promise<Equipment[]> {
    return unwrapData(api().get<ApiResponse<Equipment[]>>("/equipment/"));
  },

  getById(id: UUID): Promise<Equipment> {
    return unwrapData(api().get<ApiResponse<Equipment>>(equipmentPath(id)));
  },

  update(id: UUID, data: UpdateEquipmentRequest): Promise<Equipment> {
    return unwrapData(
      api().put<ApiResponse<Equipment>>(equipmentPath(id), data),
    );
  },

  delete(id: UUID): Promise<EmptyResponse> {
    return api().del<EmptyResponse>(equipmentPath(id));
  },
};
