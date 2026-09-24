import type { HospitalResourceStatus } from "@/entities/hospital-resource/model/types";
import type { Rfc3339DateTime, UUID } from "@/shared/api/types";

export type HospitalOperatingRoom = {
  id: UUID;
  hospital_id: UUID;
  operating_id: UUID;
  operating_name: string;
  label: string;
  status: HospitalResourceStatus;
  status_changed_at: Rfc3339DateTime;
  created_at: Rfc3339DateTime;
  updated_at: Rfc3339DateTime;
};

export type CreateHospitalOperatingRoomRequest = Pick<
  HospitalOperatingRoom,
  "operating_id" | "label"
>;
