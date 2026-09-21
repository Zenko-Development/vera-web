import { api } from "@/shared/api/client";
import { pathSegment, unwrapData } from "@/shared/api/response";
import type { ApiResponse, UUID } from "@/shared/api/types";
import type {
  ChecklistRun,
  ChecklistRunForm,
  ChecklistRunResult,
  CompleteChecklistRunResponse,
  CreateChecklistRunRequest,
} from "../model/types";

const runPath = (id: UUID) => `/checklist-runs/${pathSegment(id)}`;
const deviceAuth = { auth: true } as const;

export const checklistRunApi = {
  create(data: CreateChecklistRunRequest): Promise<ChecklistRun> {
    return unwrapData(
      api().post<ApiResponse<ChecklistRun>>(
        "/checklist-runs/",
        data,
        deviceAuth,
      ),
    );
  },

  getActive(): Promise<ChecklistRun> {
    return unwrapData(
      api().get<ApiResponse<ChecklistRun>>(
        "/checklist-runs/active",
        deviceAuth,
      ),
    );
  },

  getById(id: UUID): Promise<ChecklistRun> {
    return unwrapData(
      api().get<ApiResponse<ChecklistRun>>(runPath(id), deviceAuth),
    );
  },

  cancel(id: UUID): Promise<ChecklistRun> {
    return unwrapData(
      api().post<ApiResponse<ChecklistRun>>(
        `${runPath(id)}/cancel`,
        undefined,
        deviceAuth,
      ),
    );
  },

  complete(id: UUID): Promise<CompleteChecklistRunResponse> {
    return unwrapData(
      api().post<ApiResponse<CompleteChecklistRunResponse>>(
        `${runPath(id)}/complete`,
        undefined,
        deviceAuth,
      ),
    );
  },

  getResult(id: UUID): Promise<ChecklistRunResult> {
    return unwrapData(
      api().get<ApiResponse<ChecklistRunResult>>(
        `${runPath(id)}/result`,
        deviceAuth,
      ),
    );
  },

  getForm(id: UUID): Promise<ChecklistRunForm> {
    return unwrapData(
      api().get<ApiResponse<ChecklistRunForm>>(
        `${runPath(id)}/form`,
        deviceAuth,
      ),
    );
  },
};
