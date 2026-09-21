import { api } from "@/shared/api/client";
import { pathSegment, unwrapData } from "@/shared/api/response";
import type { ApiResponse, EmptyResponse, UUID } from "@/shared/api/types";
import type { ChecklistAnswer, PutChecklistAnswerRequest } from "../model/types";

const answersPath = (runId: UUID) =>
  `/checklist-runs/${pathSegment(runId)}/answers`;
const answerPath = (runId: UUID, questionId: UUID) =>
  `${answersPath(runId)}/${pathSegment(questionId)}`;
const deviceAuth = { auth: true } as const;

export const checklistAnswerApi = {
  put(
    runId: UUID,
    questionId: UUID,
    data: PutChecklistAnswerRequest,
  ): Promise<ChecklistAnswer> {
    return unwrapData(
      api().put<ApiResponse<ChecklistAnswer>>(
        answerPath(runId, questionId),
        data,
        deviceAuth,
      ),
    );
  },

  list(runId: UUID): Promise<ChecklistAnswer[]> {
    return unwrapData(
      api().get<ApiResponse<ChecklistAnswer[]>>(
        `${answersPath(runId)}/`,
        deviceAuth,
      ),
    );
  },

  delete(runId: UUID, questionId: UUID): Promise<EmptyResponse> {
    return api().del<EmptyResponse>(
      answerPath(runId, questionId),
      deviceAuth,
    );
  },
};
