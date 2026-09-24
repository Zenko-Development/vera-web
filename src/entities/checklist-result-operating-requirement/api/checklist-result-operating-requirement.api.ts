import { api } from "@/shared/api/client";
import { pathSegment, unwrapData } from "@/shared/api/response";
import type { ApiResponse, EmptyResponse, UUID } from "@/shared/api/types";
import type {
  ChecklistResultOperatingRequirement,
  CreateChecklistResultOperatingRequirementRequest,
  UpdateChecklistResultOperatingRequirementRequest,
} from "../model/types";

const requirementPath = (id: UUID) =>
  `/checklist-result-operating-requirements/${pathSegment(id)}`;

export const checklistResultOperatingRequirementApi = {
  create(
    resultId: UUID,
    data: CreateChecklistResultOperatingRequirementRequest,
  ): Promise<ChecklistResultOperatingRequirement> {
    return unwrapData(
      api().post<ApiResponse<ChecklistResultOperatingRequirement>>(
        `/checklist-results/${pathSegment(resultId)}/operating-requirements`,
        data,
      ),
    );
  },

  list(resultId: UUID): Promise<ChecklistResultOperatingRequirement[]> {
    return unwrapData(
      api().get<ApiResponse<ChecklistResultOperatingRequirement[]>>(
        `/checklist-results/${pathSegment(resultId)}/operating-requirements`,
      ),
    );
  },

  getById(id: UUID): Promise<ChecklistResultOperatingRequirement> {
    return unwrapData(
      api().get<ApiResponse<ChecklistResultOperatingRequirement>>(
        requirementPath(id),
      ),
    );
  },

  update(
    id: UUID,
    data: UpdateChecklistResultOperatingRequirementRequest,
  ): Promise<ChecklistResultOperatingRequirement> {
    return unwrapData(
      api().patch<ApiResponse<ChecklistResultOperatingRequirement>>(
        requirementPath(id),
        data,
      ),
    );
  },

  delete(id: UUID): Promise<EmptyResponse> {
    return api().del<EmptyResponse>(requirementPath(id));
  },
};
