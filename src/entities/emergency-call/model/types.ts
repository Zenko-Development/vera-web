import type { Rfc3339DateTime, UUID } from "@/shared/api/types";

export type EmergencyCallStatus = "active" | "completed" | "cancelled";

export type EmergencyCall = {
  id: UUID;
  device_access_session_id: UUID;
  status: EmergencyCallStatus;
  started_at: Rfc3339DateTime;
  completed_at: Rfc3339DateTime | null;
  created_at: Rfc3339DateTime;
  updated_at: Rfc3339DateTime;
};
