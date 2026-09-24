import { api } from "@/shared/api/client";
import { pathSegment, unwrapData } from "@/shared/api/response";
import type { ApiResponse, EmptyResponse, UUID } from "@/shared/api/types";
import type {
  ChecklistResultEquipmentRequirement,
  CreateChecklistResultEquipmentRequirementRequest,
  UpdateChecklistResultEquipmentRequirementRequest,
} from "../model/types";

const requirementPath = (id: UUID) =>
  `/checklist-result-equipment-requirements/${pathSegment(id)}`;

export const checklistResultEquipmentRequirementApi = {
  create(
    resultId: UUID,
    data: CreateChecklistResultEquipmentRequirementRequest,
  ): Promise<ChecklistResultEquipmentRequirement> {
    return unwrapData(
      api().post<ApiResponse<ChecklistResultEquipmentRequirement>>(
        `/checklist-results/${pathSegment(resultId)}/equipment-requirements`,
        data,
      ),
    );
  },

  list(resultId: UUID): Promise<ChecklistResultEquipmentRequirement[]> {
    return unwrapData(
      api().get<ApiResponse<ChecklistResultEquipmentRequirement[]>>(
        `/checklist-results/${pathSegment(resultId)}/equipment-requirements`,
      ),
    );
  },

  getById(id: UUID): Promise<ChecklistResultEquipmentRequirement> {
    return unwrapData(
      api().get<ApiResponse<ChecklistResultEquipmentRequirement>>(
        requirementPath(id),
      ),
    );
  },

  update(
    id: UUID,
    data: UpdateChecklistResultEquipmentRequirementRequest,
  ): Promise<ChecklistResultEquipmentRequirement> {
    return unwrapData(
      api().patch<ApiResponse<ChecklistResultEquipmentRequirement>>(
        requirementPath(id),
        data,
      ),
    );
  },

  delete(id: UUID): Promise<EmptyResponse> {
    return api().del<EmptyResponse>(requirementPath(id));
  },
};
