import type { Rfc3339DateTime, UUID } from "@/shared/api/types";
import type { ChecklistOption } from "@/entities/checklist-option/model/types";

export type ChecklistQuestionType =
  | "single"
  | "multiple"
  | "text"
  | "number"
  | "boolean";

export type ChecklistQuestion = {
  id: UUID;
  checklist_version_id: UUID;
  question: string;
  type: ChecklistQuestionType;
  position: number;
  required: boolean;
  created_at: Rfc3339DateTime;
  updated_at: Rfc3339DateTime;
};

export type ChecklistQuestionWithOptions = ChecklistQuestion & {
  options: ChecklistOption[];
};

export type CreateChecklistQuestionRequest = {
  checklist_version_id: UUID;
  question: string;
  type: ChecklistQuestionType;
  position?: number;
  required?: boolean;
};

export type UpdateChecklistQuestionRequest = {
  question: string;
  type: ChecklistQuestionType;
  position?: number;
  required?: boolean;
};
