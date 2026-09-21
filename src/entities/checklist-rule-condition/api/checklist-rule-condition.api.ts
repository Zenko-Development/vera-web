import { api } from "@/shared/api/client";
import { pathSegment, unwrapData } from "@/shared/api/response";
import type { ApiResponse, EmptyResponse, UUID } from "@/shared/api/types";
import type {
  ChecklistRuleCondition,
  CreateChecklistRuleConditionRequest,
  UpdateChecklistRuleConditionRequest,
} from "../model/types";

const conditionPath = (id: UUID) =>
  `/checklist-rule-conditions/${pathSegment(id)}`;

export const checklistRuleConditionApi = {
  create(
    ruleId: UUID,
    data: CreateChecklistRuleConditionRequest,
  ): Promise<ChecklistRuleCondition> {
    return unwrapData(
      api().post<ApiResponse<ChecklistRuleCondition>>(
        `/checklist-rules/${pathSegment(ruleId)}/conditions`,
        data,
      ),
    );
  },

  list(ruleId: UUID): Promise<ChecklistRuleCondition[]> {
    return unwrapData(
      api().get<ApiResponse<ChecklistRuleCondition[]>>(
        `/checklist-rules/${pathSegment(ruleId)}/conditions`,
      ),
    );
  },

  getById(id: UUID): Promise<ChecklistRuleCondition> {
    return unwrapData(
      api().get<ApiResponse<ChecklistRuleCondition>>(conditionPath(id)),
    );
  },

  update(
    id: UUID,
    data: UpdateChecklistRuleConditionRequest,
  ): Promise<ChecklistRuleCondition> {
    return unwrapData(
      api().patch<ApiResponse<ChecklistRuleCondition>>(conditionPath(id), data),
    );
  },

  delete(id: UUID): Promise<EmptyResponse> {
    return api().del<EmptyResponse>(conditionPath(id));
  },
};
