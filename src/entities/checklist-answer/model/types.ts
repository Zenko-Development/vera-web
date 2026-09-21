import type { Rfc3339DateTime, UUID } from "@/shared/api/types";

export type ChecklistAnswer = {
  id: UUID;
  checklist_run_id: UUID;
  checklist_question_id: UUID;
  value: string | null;
  option_ids: UUID[];
  created_at: Rfc3339DateTime;
  updated_at: Rfc3339DateTime;
};

export type OptionChecklistAnswerRequest = {
  option_ids: UUID[];
  value?: never;
};

export type ValueChecklistAnswerRequest = {
  value: string;
  option_ids?: never;
};

export type PutChecklistAnswerRequest =
  | OptionChecklistAnswerRequest
  | ValueChecklistAnswerRequest;
