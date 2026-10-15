import { api } from "@/shared/api/client";
import { pathSegment, unwrapData } from "@/shared/api/response";
import type { ApiResponse, UUID } from "@/shared/api/types";
import type {
  HospitalOperatingOperation,
  ListHospitalOperatingOperationsParams,
  SaveHospitalOperatingOperationRequest,
  UpdateHospitalOperatingOperationStatusRequest,
} from "../model/types";

const roomOperationsPath = (roomId: UUID) =>
  `/hospital-operating-rooms/${pathSegment(roomId)}/operations`;
const operationPath = (operationId: UUID) =>
  `/hospital-operating-operations/${pathSegment(operationId)}`;

export const hospitalOperatingOperationApi = {
  list(
    roomId: UUID,
    params: ListHospitalOperatingOperationsParams = {},
  ): Promise<HospitalOperatingOperation[]> {
    return unwrapData(
      api().get<ApiResponse<HospitalOperatingOperation[]>>(
        roomOperationsPath(roomId),
        { params },
      ),
    );
  },

  create(
    roomId: UUID,
    data: SaveHospitalOperatingOperationRequest,
  ): Promise<HospitalOperatingOperation> {
    return unwrapData(
      api().post<ApiResponse<HospitalOperatingOperation>>(
        roomOperationsPath(roomId),
        data,
      ),
    );
  },

  update(
    operationId: UUID,
    data: SaveHospitalOperatingOperationRequest,
  ): Promise<HospitalOperatingOperation> {
    return unwrapData(
      api().put<ApiResponse<HospitalOperatingOperation>>(
        operationPath(operationId),
        data,
      ),
    );
  },

  updateStatus(
    operationId: UUID,
    data: UpdateHospitalOperatingOperationStatusRequest,
  ): Promise<HospitalOperatingOperation> {
    return unwrapData(
      api().patch<ApiResponse<HospitalOperatingOperation>>(
        `${operationPath(operationId)}/status`,
        data,
      ),
    );
  },
};
