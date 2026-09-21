import type { Rfc3339DateTime, UUID } from "@/shared/api/types";

export type ChecklistResultRouting = {
  id: UUID;
  result_id: UUID;
  routing_type: ChecklistResultRoutingType;
  /** The backend serializes an unused foreign key as a zero UUID. */
  facility_type_id: UUID;
  /** The backend serializes an unused foreign key as a zero UUID. */
  hospital_id: UUID;
  created_at: Rfc3339DateTime;
  updated_at: Rfc3339DateTime;
};

export type ChecklistResultRoutingType =
  | "fixed"
  | "by_tag"
  | "by_service_area";

export type FixedRoutingRequest = {
  routing_type: "fixed";
  hospital_id: UUID;
  facility_type_id?: never;
};

export type ByTagRoutingRequest = {
  routing_type: "by_tag";
  facility_type_id: UUID;
  hospital_id?: never;
};

export type ByServiceAreaRoutingRequest = {
  routing_type: "by_service_area";
  facility_type_id?: never;
  hospital_id?: never;
};

export type ChecklistResultRoutingRequest =
  | FixedRoutingRequest
  | ByTagRoutingRequest
  | ByServiceAreaRoutingRequest;
