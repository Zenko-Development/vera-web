import type { LinkedHospital } from "@/entities/hospital/model/types";
import type { Sickness } from "@/entities/sickness/model/types";
import { api } from "@/shared/api/client";
import { pathSegment, unwrapData } from "@/shared/api/response";
import type { ApiResponse, EmptyResponse, UUID } from "@/shared/api/types";
import type { HospitalSickness } from "../model/types";

const relationPath = (hospitalId: UUID, sicknessId: UUID) =>
  `/link/hospital/${pathSegment(hospitalId)}/sickness/${pathSegment(sicknessId)}`;

export const hospitalSicknessApi = {
  link(hospitalId: UUID, sicknessId: UUID): Promise<HospitalSickness> {
    return unwrapData(
      api().post<ApiResponse<HospitalSickness>>(
        relationPath(hospitalId, sicknessId),
      ),
    );
  },

  unlink(hospitalId: UUID, sicknessId: UUID): Promise<EmptyResponse> {
    return api().del<EmptyResponse>(relationPath(hospitalId, sicknessId));
  },

  listHospitals(sicknessId: UUID): Promise<LinkedHospital[]> {
    return unwrapData(
      api().get<ApiResponse<LinkedHospital[]>>(
        `/link/sickness/${pathSegment(sicknessId)}/hospital`,
      ),
    );
  },

  listSicknesses(hospitalId: UUID): Promise<Sickness[]> {
    return unwrapData(
      api().get<ApiResponse<Sickness[]>>(
        `/link/hospital/${pathSegment(hospitalId)}/sickness`,
      ),
    );
  },
};
