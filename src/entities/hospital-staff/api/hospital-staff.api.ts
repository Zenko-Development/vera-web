import { api } from "@/shared/api/client";
import { pathSegment, unwrapData } from "@/shared/api/response";
import type { ApiResponse, EmptyResponse, UUID } from "@/shared/api/types";
import type {
  CreateHospitalStaffAssignmentRequest,
  HospitalStaffAssignment,
  HospitalStaffIds,
} from "../model/types";

const assignmentPath = (userId: UUID, hospitalId: UUID) =>
  `/hospital-staff/users/${pathSegment(userId)}/hospitals/${pathSegment(hospitalId)}`;

export const hospitalStaffApi = {
  assign(
    data: CreateHospitalStaffAssignmentRequest,
  ): Promise<HospitalStaffAssignment> {
    return unwrapData(
      api().post<ApiResponse<HospitalStaffAssignment>>("/hospital-staff/", data),
    );
  },

  revoke(userId: UUID, hospitalId: UUID): Promise<EmptyResponse> {
    return api().del<EmptyResponse>(assignmentPath(userId, hospitalId));
  },

  listHospitalIds(userId: UUID): Promise<HospitalStaffIds> {
    return unwrapData(
      api().get<ApiResponse<HospitalStaffIds>>(
        `/hospital-staff/users/${pathSegment(userId)}/hospitals`,
      ),
    );
  },

  listUserIds(hospitalId: UUID): Promise<HospitalStaffIds> {
    return unwrapData(
      api().get<ApiResponse<HospitalStaffIds>>(
        `/hospital-staff/hospitals/${pathSegment(hospitalId)}/users`,
      ),
    );
  },
};
