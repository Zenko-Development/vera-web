import { api } from "@/shared/api/client";
import { pathSegment, unwrapData } from "@/shared/api/response";
import type { ApiResponse, EmptyResponse, UUID } from "@/shared/api/types";
import type {
  ChecklistResult,
  CreateChecklistResultRequest,
  UpdateChecklistResultRequest,
} from "../model/types";

export const checklistResultApi = {
  create(
    versionId: UUID,
    data: CreateChecklistResultRequest,
  ): Promise<ChecklistResult> {
    return unwrapData(
      api().post<ApiResponse<ChecklistResult>>(
        `/checklist-versions/${pathSegment(versionId)}/results`,
        data,
      ),
    );
  },

  list(versionId: UUID): Promise<ChecklistResult[]> {
    return unwrapData(
      api().get<ApiResponse<ChecklistResult[]>>(
        `/checklist-versions/${pathSegment(versionId)}/results`,
      ),
    );
  },

  getById(id: UUID): Promise<ChecklistResult> {
    return unwrapData(
      api().get<ApiResponse<ChecklistResult>>(
        `/checklist-results/${pathSegment(id)}`,
      ),
    );
  },

  update(id: UUID, data: UpdateChecklistResultRequest): Promise<ChecklistResult> {
    return unwrapData(
      api().patch<ApiResponse<ChecklistResult>>(
        `/checklist-results/${pathSegment(id)}`,
        data,
      ),
    );
  },

  delete(id: UUID): Promise<EmptyResponse> {
    return api().del<EmptyResponse>(`/checklist-results/${pathSegment(id)}`);
  },
};
