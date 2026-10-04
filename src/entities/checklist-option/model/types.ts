import type { Rfc3339DateTime, UUID } from "@/shared/api/types";

export type ChecklistOption = {
  id: UUID;
  checklist_question_id?: UUID;
  label: string;
  value: string;
  position: number;
  created_at?: Rfc3339DateTime;
  updated_at?: Rfc3339DateTime;
};

export type CreateChecklistOptionRequest = {
  label: string;
  value: string;
  position?: number;
};

export type UpdateChecklistOptionRequest = {
  label: string;
  value: string;
  position?: number;
};
