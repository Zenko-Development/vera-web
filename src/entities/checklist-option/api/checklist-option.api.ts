import { api } from "@/shared/api/client";
import { pathSegment, unwrapData } from "@/shared/api/response";
import type { ApiResponse, EmptyResponse, UUID } from "@/shared/api/types";
import type {
  ChecklistOption,
  CreateChecklistOptionRequest,
  UpdateChecklistOptionRequest,
} from "../model/types";

export const checklistOptionApi = {
  create(
    questionId: UUID,
    data: CreateChecklistOptionRequest,
  ): Promise<ChecklistOption> {
    return unwrapData(
      api().post<ApiResponse<ChecklistOption>>(
        `/checklist-questions/${pathSegment(questionId)}/options`,
        data,
      ),
    );
  },

  list(questionId: UUID): Promise<ChecklistOption[]> {
    return unwrapData(
      api().get<ApiResponse<ChecklistOption[]>>(
        `/checklist-questions/${pathSegment(questionId)}/options`,
      ),
    );
  },

  getById(id: UUID): Promise<ChecklistOption> {
    return unwrapData(
      api().get<ApiResponse<ChecklistOption>>(
        `/checklist-options/${pathSegment(id)}`,
      ),
    );
  },

  update(id: UUID, data: UpdateChecklistOptionRequest): Promise<ChecklistOption> {
    return unwrapData(
      api().patch<ApiResponse<ChecklistOption>>(
        `/checklist-options/${pathSegment(id)}`,
        data,
      ),
    );
  },

  delete(id: UUID): Promise<EmptyResponse> {
    return api().del<EmptyResponse>(`/checklist-options/${pathSegment(id)}`);
  },
};
