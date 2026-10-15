export type HospitalEquipmentStatus = "available" | "busy" | "unavailable";
export type HospitalOperatingRoomStatus = "ready" | "occupied" | "maintenance";
export type HospitalResourceStatus =
  | HospitalEquipmentStatus
  | HospitalOperatingRoomStatus;

export type UpdateHospitalResourceStatusRequest<
  Status extends HospitalResourceStatus = HospitalResourceStatus,
> = {
  status: Status;
};
