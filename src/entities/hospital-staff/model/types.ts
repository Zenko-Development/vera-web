import type { UUID } from "@/shared/api/types";

export type HospitalStaffAssignment = {
  user_id: UUID;
  hospital_id: UUID;
};

export type CreateHospitalStaffAssignmentRequest = Pick<
  HospitalStaffAssignment,
  "user_id" | "hospital_id"
>;

export type HospitalStaffIds = {
  ids: UUID[];
};
