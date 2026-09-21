import { checklistQuestionApi } from "@/entities/checklist-question/api/checklist-question.api";
import type { CreateChecklistQuestionRequest } from "@/entities/checklist-question/model/types";
import { checklistVersionApi } from "@/entities/checklist-version/api/checklist-version.api";
import type { UUID } from "@/shared/api/types";

type QuestionWithoutVersion = Omit<
  CreateChecklistQuestionRequest,
  "checklist_version_id"
>;

/**
 * Helpers for endpoints whose backend currently requires the same identifier
 * both in the URL and in the JSON body.
 */
export const checklistController = {
  createVersion(checklistId: UUID) {
    return checklistVersionApi.create(checklistId, {
      checklist_id: checklistId,
    });
  },

  createQuestion(versionId: UUID, data: QuestionWithoutVersion) {
    return checklistQuestionApi.create(versionId, {
      ...data,
      checklist_version_id: versionId,
    });
  },
};
