import { api } from "@/shared/api/client";
import { pathSegment, unwrapData } from "@/shared/api/response";
import type { ApiResponse, EmptyResponse, UUID } from "@/shared/api/types";
import type {
  ChecklistResultRouting,
  ChecklistResultRoutingRequest,
} from "../model/types";

const routingPath = (id: UUID) =>
  `/checklist-result-routing/${pathSegment(id)}`;

export const checklistResultRoutingApi = {
  create(
    resultId: UUID,
    data: ChecklistResultRoutingRequest,
  ): Promise<ChecklistResultRouting> {
    return unwrapData(
      api().post<ApiResponse<ChecklistResultRouting>>(routingPath(resultId), data),
    );
  },

  getById(id: UUID): Promise<ChecklistResultRouting> {
    return unwrapData(
      api().get<ApiResponse<ChecklistResultRouting>>(routingPath(id)),
    );
  },

  getByResultId(resultId: UUID): Promise<ChecklistResultRouting> {
    return unwrapData(
      api().get<ApiResponse<ChecklistResultRouting>>(
        `/checklist-result-routing/checklist-results/${pathSegment(resultId)}`,
      ),
    );
  },

  update(
    id: UUID,
    data: ChecklistResultRoutingRequest,
  ): Promise<ChecklistResultRouting> {
    return unwrapData(
      api().patch<ApiResponse<ChecklistResultRouting>>(routingPath(id), data),
    );
  },

  delete(id: UUID): Promise<EmptyResponse> {
    return api().del<EmptyResponse>(routingPath(id));
  },
};
