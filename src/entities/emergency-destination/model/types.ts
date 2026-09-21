import type { Rfc3339DateTime, UUID } from "@/shared/api/types";

export type EmergencyDestinationRoutingType =
  | "fixed"
  | "by_tag"
  | "by_service_area";

export type EmergencyDestinationStatus =
  | "selected"
  | "awaiting_selection"
  | "no_candidates";

/**
 * The backend documentation guarantees an immutable candidate snapshot, but
 * does not yet publish the fields of that snapshot.
 */
export type EmergencyDestinationCandidate = {
  [field: string]: unknown;
};

export type EmergencyDestination = {
  status: EmergencyDestinationStatus;
  routing_type: EmergencyDestinationRoutingType;
  candidates: EmergencyDestinationCandidate[];
  hospital_id?: UUID | null;
  id?: UUID;
  emergency_call_id?: UUID;
  created_at?: Rfc3339DateTime;
  updated_at?: Rfc3339DateTime;
  [field: string]: unknown;
};

export type SelectEmergencyDestinationRequest = {
  hospital_id: UUID;
};
