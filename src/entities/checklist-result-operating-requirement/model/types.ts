import type { Rfc3339DateTime, UUID } from "@/shared/api/types";

export type ChecklistResultOperatingRequirement = {
  id: UUID;
  checklist_result_id: UUID;
  operating_id: UUID;
  required_count: number;
  created_at: Rfc3339DateTime;
  updated_at: Rfc3339DateTime;
};

export type CreateChecklistResultOperatingRequirementRequest = Pick<
  ChecklistResultOperatingRequirement,
  "operating_id" | "required_count"
>;

export type UpdateChecklistResultOperatingRequirementRequest = Pick<
  ChecklistResultOperatingRequirement,
  "required_count"
>;
