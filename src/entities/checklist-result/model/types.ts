import type { Rfc3339DateTime, UUID } from "@/shared/api/types";

export type ChecklistResult = {
  id: UUID;
  checklist_version_id: UUID;
  title: string;
  message: string;
  created_at: Rfc3339DateTime;
  updated_at: Rfc3339DateTime;
};

export type CreateChecklistResultRequest = {
  title?: string;
  message?: string;
};

/** PATCH replaces both fields, so callers must send the complete editable DTO. */
export type UpdateChecklistResultRequest = {
  title: string;
  message: string;
};
