import type { ChecklistQuestionType } from "@/entities/checklist-question/model/types";
import type { Rfc3339DateTime, UUID } from "@/shared/api/types";

export type ChecklistRunStatus = "in_progress" | "cancelled" | "completed";

export type ChecklistRun = {
  id: UUID;
  checklist_version_id: UUID;
  device_access_session_id: UUID;
  emergency_call_id: UUID;
  status: ChecklistRunStatus;
  started_at: Rfc3339DateTime;
  completed_at: Rfc3339DateTime | null;
  created_at: Rfc3339DateTime;
  updated_at: Rfc3339DateTime;
};

export type CreateChecklistRunRequest = {
  checklist_id: UUID;
  emergency_call_id: UUID;
};

export type ChecklistRunResult = {
  id: UUID;
  checklist_run_id: UUID;
  checklist_rule_id: UUID;
  checklist_result_id: UUID;
  title: string;
  message: string;
  calculated_at: Rfc3339DateTime;
};

export type CompleteChecklistRunResponse = {
  run: ChecklistRun;
  result: ChecklistRunResult;
};

export type ChecklistRunFormOption = {
  id: UUID;
  label: string;
  value: string;
  position: number;
};

export type ChecklistRunFormQuestion = {
  id: UUID;
  question: string;
  type: ChecklistQuestionType;
  position: number;
  required: boolean;
  options: ChecklistRunFormOption[];
};

export type ChecklistRunForm = {
  checklist_run_id: UUID;
  checklist_version_id: UUID;
  questions: ChecklistRunFormQuestion[];
};
