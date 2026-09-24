import type { Rfc3339DateTime, UUID } from "@/shared/api/types";

export type AuditActorKind = "user" | "device";

export type AuditEvent = {
  id: UUID;
  event_type: string;
  actor_kind: AuditActorKind;
  actor_user_id: UUID | null;
  actor_device_id: UUID | null;
  entity_type: string;
  entity_id: UUID;
  emergency_call_id: UUID | null;
  payload: Record<string, unknown>;
  occurred_at: Rfc3339DateTime;
};

export type ListAuditEventsParams = {
  limit?: number;
  offset?: number;
};
