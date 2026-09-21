import type { Rfc3339DateTime, UUID } from "@/shared/api/types";

export type ChecklistRule = {
  id: UUID;
  checklist_version_id: UUID;
  result_id: UUID;
  name: string;
  priority: number;
  created_at: Rfc3339DateTime;
  updated_at: Rfc3339DateTime;
};

export type CreateChecklistRuleRequest = {
  result_id: UUID;
  name: string;
  priority?: number;
};

export type UpdateChecklistRuleRequest = CreateChecklistRuleRequest;
