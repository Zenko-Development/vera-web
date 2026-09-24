import { api } from "@/shared/api/client";
import { unwrapData } from "@/shared/api/response";
import type { ApiResponse } from "@/shared/api/types";
import type { HospitalArrival } from "../model/types";

export const hospitalArrivalApi = {
  list(): Promise<HospitalArrival[]> {
    return unwrapData(
      api().get<ApiResponse<HospitalArrival[]>>("/hospital-arrivals"),
    );
  },
};
