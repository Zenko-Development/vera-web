import { api } from "@/shared/api/client";
import { pathSegment, unwrapData } from "@/shared/api/response";
import type { ApiResponse, EmptyResponse, UUID } from "@/shared/api/types";
import type {
  Checklist,
  CreateChecklistRequest,
  UpdateChecklistRequest,
} from "../model/types";

export const checklistApi = {
  create(data: CreateChecklistRequest): Promise<Checklist> {
    return unwrapData(api().post<ApiResponse<Checklist>>("/checklist/", data));
  },

  list(): Promise<Checklist[]> {
    return unwrapData(api().get<ApiResponse<Checklist[]>>("/checklist/"));
  },

  getById(id: UUID): Promise<Checklist> {
    return unwrapData(
      api().get<ApiResponse<Checklist>>(`/checklist/${pathSegment(id)}`),
    );
  },

  listBySickness(sicknessId: UUID): Promise<Checklist[]> {
    return unwrapData(
      api().get<ApiResponse<Checklist[]>>(
        `/checklist/sickness/${pathSegment(sicknessId)}`,
      ),
    );
  },

  update(id: UUID, data: UpdateChecklistRequest): Promise<Checklist> {
    return unwrapData(
      api().patch<ApiResponse<Checklist>>(`/checklist/${pathSegment(id)}`, data),
    );
  },

  delete(id: UUID): Promise<EmptyResponse> {
    return api().del<EmptyResponse>(`/checklist/${pathSegment(id)}`);
  },
};
