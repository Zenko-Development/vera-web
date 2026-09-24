export type HospitalResourceStatus = "available" | "busy" | "unavailable";

export type UpdateHospitalResourceStatusRequest = {
  status: HospitalResourceStatus;
};
