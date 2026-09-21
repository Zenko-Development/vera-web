import { api } from "@/shared/api/client";
import { pathSegment, unwrapData } from "@/shared/api/response";
import type { ApiResponse, UUID } from "@/shared/api/types";
import type {
  ChecklistVersion,
  CreateChecklistVersionRequest,
} from "../model/types";

const versionsPath = (checklistId: UUID) =>
  `/checklist/${pathSegment(checklistId)}/versions`;

export const checklistVersionApi = {
  create(
    checklistId: UUID,
    data: CreateChecklistVersionRequest = {},
  ): Promise<ChecklistVersion> {
    return unwrapData(
      api().post<ApiResponse<ChecklistVersion>>(`${versionsPath(checklistId)}/`, data),
    );
  },

  list(checklistId: UUID): Promise<ChecklistVersion[]> {
    return unwrapData(
      api().get<ApiResponse<ChecklistVersion[]>>(`${versionsPath(checklistId)}/`),
    );
  },

  getPublished(checklistId: UUID): Promise<ChecklistVersion> {
    return unwrapData(
      api().get<ApiResponse<ChecklistVersion>>(
        `${versionsPath(checklistId)}/published`,
      ),
    );
  },

  getLatest(checklistId: UUID): Promise<ChecklistVersion> {
    return unwrapData(
      api().get<ApiResponse<ChecklistVersion>>(`${versionsPath(checklistId)}/latest`),
    );
  },

  publish(id: UUID): Promise<ChecklistVersion> {
    return unwrapData(
      api().post<ApiResponse<ChecklistVersion>>(
        `/checklist-versions/${pathSegment(id)}/publish`,
      ),
    );
  },

  archive(id: UUID): Promise<ChecklistVersion> {
    return unwrapData(
      api().post<ApiResponse<ChecklistVersion>>(
        `/checklist-versions/${pathSegment(id)}/archive`,
      ),
    );
  },
};
