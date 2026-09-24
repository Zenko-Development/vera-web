import type { UpdateHospitalResourceStatusRequest } from "@/entities/hospital-resource/model/types";
import { api } from "@/shared/api/client";
import { pathSegment, unwrapData } from "@/shared/api/response";
import type { ApiResponse, EmptyResponse, UUID } from "@/shared/api/types";
import type {
  CreateHospitalEquipmentRequest,
  HospitalEquipment,
} from "../model/types";

const hospitalEquipmentPath = (id: UUID) =>
  `/hospital-equipment/${pathSegment(id)}`;

export const hospitalEquipmentApi = {
  create(
    hospitalId: UUID,
    data: CreateHospitalEquipmentRequest,
  ): Promise<HospitalEquipment> {
    return unwrapData(
      api().post<ApiResponse<HospitalEquipment>>(
        `/hospitals/${pathSegment(hospitalId)}/equipment`,
        data,
      ),
    );
  },

  list(hospitalId: UUID): Promise<HospitalEquipment[]> {
    return unwrapData(
      api().get<ApiResponse<HospitalEquipment[]>>(
        `/hospitals/${pathSegment(hospitalId)}/equipment`,
      ),
    );
  },

  getById(id: UUID): Promise<HospitalEquipment> {
    return unwrapData(
      api().get<ApiResponse<HospitalEquipment>>(hospitalEquipmentPath(id)),
    );
  },

  updateStatus(
    id: UUID,
    data: UpdateHospitalResourceStatusRequest,
  ): Promise<HospitalEquipment> {
    return unwrapData(
      api().patch<ApiResponse<HospitalEquipment>>(
        `${hospitalEquipmentPath(id)}/status`,
        data,
      ),
    );
  },

  delete(id: UUID): Promise<EmptyResponse> {
    return api().del<EmptyResponse>(hospitalEquipmentPath(id));
  },
};
