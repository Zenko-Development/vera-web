import type { Rfc3339DateTime, UUID } from "@/shared/api/types";

export type ChecklistVersionStatus = "draft" | "published" | "archived";

export type ChecklistVersion = {
  id: UUID;
  checklist_id: UUID;
  version: number;
  status: ChecklistVersionStatus;
  created_at: Rfc3339DateTime;
  /** Empty string until the version is published. */
  published_at: Rfc3339DateTime | "";
};

export type CreateChecklistVersionRequest = {
  /** Optional duplicate of the URL identifier; when sent, it must match it. */
  checklist_id?: UUID;
};
