import type { Rfc3339DateTime, UUID } from "@/shared/api/types";

export type DeviceStatus = "active" | "inactive" | "disabled";

export type Device = {
  id: UUID;
  device_id: string;
  status: DeviceStatus;
  last_seen_at?: Rfc3339DateTime;
  created_at: Rfc3339DateTime;
  updated_at: Rfc3339DateTime;
};

export type DeviceCredentials = {
  device: Device;
  /** Returned only during provisioning or secret rotation. */
  auth_secret: string;
  /** Exact JSON string that must be encoded into the QR code unchanged. */
  qr_payload: string;
};
