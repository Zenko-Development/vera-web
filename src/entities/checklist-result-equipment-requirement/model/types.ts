import type { Rfc3339DateTime, UUID } from "@/shared/api/types";

export type ChecklistResultEquipmentRequirement = {
  id: UUID;
  checklist_result_id: UUID;
  equipment_id: UUID;
  required_count: number;
  created_at: Rfc3339DateTime;
  updated_at: Rfc3339DateTime;
};

export type CreateChecklistResultEquipmentRequirementRequest = Pick<
  ChecklistResultEquipmentRequirement,
  "equipment_id" | "required_count"
>;

export type UpdateChecklistResultEquipmentRequirementRequest = Pick<
  ChecklistResultEquipmentRequirement,
  "required_count"
>;
