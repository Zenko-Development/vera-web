import { api } from "@/shared/api/client";
import { pathSegment, unwrapData } from "@/shared/api/response";
import type { ApiResponse, EmptyResponse, UUID } from "@/shared/api/types";
import type {
  ChecklistQuestion,
  CreateChecklistQuestionRequest,
  UpdateChecklistQuestionRequest,
} from "../model/types";

export const checklistQuestionApi = {
  create(
    versionId: UUID,
    data: CreateChecklistQuestionRequest,
  ): Promise<ChecklistQuestion> {
    return unwrapData(
      api().post<ApiResponse<ChecklistQuestion>>(
        `/checklist-questions/${pathSegment(versionId)}/checklist-versions`,
        data,
      ),
    );
  },

  getById(id: UUID): Promise<ChecklistQuestion> {
    return unwrapData(
      api().get<ApiResponse<ChecklistQuestion>>(
        `/checklist-questions/${pathSegment(id)}`,
      ),
    );
  },

  getByIdViaChecklistVersionsRoute(id: UUID): Promise<ChecklistQuestion> {
    return unwrapData(
      api().get<ApiResponse<ChecklistQuestion>>(
        `/checklist-questions/checklist-versions/${pathSegment(id)}`,
      ),
    );
  },

  update(
    id: UUID,
    data: UpdateChecklistQuestionRequest,
  ): Promise<ChecklistQuestion> {
    return unwrapData(
      api().patch<ApiResponse<ChecklistQuestion>>(
        `/checklist-questions/${pathSegment(id)}`,
        data,
      ),
    );
  },

  delete(id: UUID): Promise<EmptyResponse> {
    return api().del<EmptyResponse>(`/checklist-questions/${pathSegment(id)}`);
  },
};
