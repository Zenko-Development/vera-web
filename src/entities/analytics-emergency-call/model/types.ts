import type {
  EmergencyDestinationRoutingType,
  EmergencyDestinationStatus,
} from "@/entities/emergency-destination/model/types";
import type { Rfc3339DateTime, UUID } from "@/shared/api/types";

export type AnalyticsHospitalSnapshot = {
  hospital_id: UUID;
  name: string;
  address: string;
};

export type AnalyticsChecklistRunResult = {
  id: UUID;
  checklist_rule_id: UUID;
  checklist_result_id: UUID;
  title: string;
  message: string;
  calculated_at: Rfc3339DateTime;
};

export type AnalyticsChecklistRun = {
  id: UUID;
  checklist_version_id: UUID;
  checklist_version: number;
  status: "completed";
  started_at: Rfc3339DateTime;
  completed_at: Rfc3339DateTime;
  result: AnalyticsChecklistRunResult;
};

export type AnalyticsEmergencyDestination = {
  id: UUID;
  checklist_run_result_id: UUID;
  routing_type: EmergencyDestinationRoutingType;
  status: EmergencyDestinationStatus;
  selected_hospital: AnalyticsHospitalSnapshot | null;
  resolved_at: Rfc3339DateTime;
  selected_at: Rfc3339DateTime | null;
  /** Present only in the detailed endpoint. */
  candidates?: AnalyticsHospitalSnapshot[];
};

export type AnalyticsEmergencyCall = {
  id: UUID;
  status: "completed";
  started_at: Rfc3339DateTime;
  completed_at: Rfc3339DateTime;
  device_access_session_id: UUID;
  device_identifier: string;
  vehicle: {
    id: UUID;
    car_number: string;
  };
  checklist_run: AnalyticsChecklistRun;
  destination: AnalyticsEmergencyDestination | null;
};

export type ListAnalyticsEmergencyCallsParams = {
  limit?: number;
  offset?: number;
};
