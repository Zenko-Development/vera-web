import { api } from "@/shared/api/client";
import { unwrapData } from "@/shared/api/response";
import type { ApiResponse } from "@/shared/api/types";
import type { FleetLiveVehicle } from "../model/types";

export const fleetLiveApi = {
  list(): Promise<FleetLiveVehicle[]> {
    return unwrapData(api().get<ApiResponse<FleetLiveVehicle[]>>("/fleet/live"));
  },
};
