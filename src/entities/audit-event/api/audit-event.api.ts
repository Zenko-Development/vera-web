import { api } from "@/shared/api/client";
import { unwrapData } from "@/shared/api/response";
import type { ApiResponse } from "@/shared/api/types";
import type { AuditEvent, ListAuditEventsParams } from "../model/types";

export const auditEventApi = {
  list(params: ListAuditEventsParams = {}): Promise<AuditEvent[]> {
    return unwrapData(
      api().get<ApiResponse<AuditEvent[]>>("/audit/events", { params }),
    );
  },
};
