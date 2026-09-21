import { api } from "@/shared/api/client";
import { pathSegment, unwrapData } from "@/shared/api/response";
import type { ApiResponse, EmptyResponse, UUID } from "@/shared/api/types";
import type {
  ChecklistRule,
  CreateChecklistRuleRequest,
  UpdateChecklistRuleRequest,
} from "../model/types";

export const checklistRuleApi = {
  create(
    versionId: UUID,
    data: CreateChecklistRuleRequest,
  ): Promise<ChecklistRule> {
    return unwrapData(
      api().post<ApiResponse<ChecklistRule>>(
        `/checklist-versions/${pathSegment(versionId)}/rules`,
        data,
      ),
    );
  },

  list(versionId: UUID): Promise<ChecklistRule[]> {
    return unwrapData(
      api().get<ApiResponse<ChecklistRule[]>>(
        `/checklist-versions/${pathSegment(versionId)}/rules`,
      ),
    );
  },

  count(versionId: UUID): Promise<number> {
    return unwrapData(
      api().get<ApiResponse<number>>(
        `/checklist-versions/${pathSegment(versionId)}/rules/count`,
      ),
    );
  },

  getById(id: UUID): Promise<ChecklistRule> {
    return unwrapData(
      api().get<ApiResponse<ChecklistRule>>(`/checklist-rules/${pathSegment(id)}`),
    );
  },

  update(id: UUID, data: UpdateChecklistRuleRequest): Promise<ChecklistRule> {
    return unwrapData(
      api().patch<ApiResponse<ChecklistRule>>(
        `/checklist-rules/${pathSegment(id)}`,
        data,
      ),
    );
  },

  delete(id: UUID): Promise<EmptyResponse> {
    return api().del<EmptyResponse>(`/checklist-rules/${pathSegment(id)}`);
  },
};
