import type { UpdateHospitalResourceStatusRequest } from "@/entities/hospital-resource/model/types";
import { api } from "@/shared/api/client";
import { pathSegment, unwrapData } from "@/shared/api/response";
import type { ApiResponse, EmptyResponse, UUID } from "@/shared/api/types";
import type {
  CreateHospitalOperatingRoomRequest,
  HospitalOperatingRoom,
} from "../model/types";

const hospitalOperatingRoomPath = (id: UUID) =>
  `/hospital-operating-rooms/${pathSegment(id)}`;

export const hospitalOperatingRoomApi = {
  create(
    hospitalId: UUID,
    data: CreateHospitalOperatingRoomRequest,
  ): Promise<HospitalOperatingRoom> {
    return unwrapData(
      api().post<ApiResponse<HospitalOperatingRoom>>(
        `/hospitals/${pathSegment(hospitalId)}/operating-rooms`,
        data,
      ),
    );
  },

  list(hospitalId: UUID): Promise<HospitalOperatingRoom[]> {
    return unwrapData(
      api().get<ApiResponse<HospitalOperatingRoom[]>>(
        `/hospitals/${pathSegment(hospitalId)}/operating-rooms`,
      ),
    );
  },

  getById(id: UUID): Promise<HospitalOperatingRoom> {
    return unwrapData(
      api().get<ApiResponse<HospitalOperatingRoom>>(
        hospitalOperatingRoomPath(id),
      ),
    );
  },

  updateStatus(
    id: UUID,
    data: UpdateHospitalResourceStatusRequest,
  ): Promise<HospitalOperatingRoom> {
    return unwrapData(
      api().patch<ApiResponse<HospitalOperatingRoom>>(
        `${hospitalOperatingRoomPath(id)}/status`,
        data,
      ),
    );
  },

  delete(id: UUID): Promise<EmptyResponse> {
    return api().del<EmptyResponse>(hospitalOperatingRoomPath(id));
  },
};
