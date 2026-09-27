import type { HospitalArrival } from "@/entities/hospital-arrival/model/types";

type ArrivalWithCoordinates = HospitalArrival & {
  latitude?: number;
  longitude?: number;
  location_latitude?: number;
  location_longitude?: number;
};

export function getArrivalCoordinates(
  arrival: HospitalArrival,
): [number, number] | null {
  const candidate = arrival as ArrivalWithCoordinates;
  const latitude = candidate.latitude ?? candidate.location_latitude;
  const longitude = candidate.longitude ?? candidate.location_longitude;
  return Number.isFinite(latitude) && Number.isFinite(longitude)
    ? [latitude as number, longitude as number]
    : null;
}
