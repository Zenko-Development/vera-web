import type { Rfc3339DateTime, UUID } from "@/shared/api/types";

export type HospitalOperatingOperationType = "planned" | "unplanned";
export type HospitalOperatingOperationStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";

export type HospitalOperatingOperation = {
  id: UUID;
  hospital_operating_room_id: UUID;
  title: string;
  description: string;
  operation_type: HospitalOperatingOperationType;
  priority: number;
  status: HospitalOperatingOperationStatus;
  starts_at: Rfc3339DateTime;
  ends_at: Rfc3339DateTime;
  duration_minutes: number;
  created_at: Rfc3339DateTime;
  updated_at: Rfc3339DateTime;
};

export type SaveHospitalOperatingOperationRequest = Pick<
  HospitalOperatingOperation,
  "title" | "description" | "operation_type" | "priority" | "starts_at" | "ends_at"
>;

export type UpdateHospitalOperatingOperationStatusRequest = {
  status: Extract<
    HospitalOperatingOperationStatus,
    "in_progress" | "completed" | "cancelled"
  >;
};

export type ListHospitalOperatingOperationsParams = {
  from?: Rfc3339DateTime;
  to?: Rfc3339DateTime;
};
