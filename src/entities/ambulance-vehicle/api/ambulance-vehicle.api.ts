import { api } from "@/shared/api/client";
import { pathSegment, unwrapData } from "@/shared/api/response";
import type { ApiResponse, UUID } from "@/shared/api/types";
import type {
  AmbulanceVehicle,
  CreateAmbulanceVehicleRequest,
  UpdateAmbulanceVehicleRequest,
} from "../model/types";

const vehiclePath = (id: UUID) =>
  `/ambulance-vehicles/${pathSegment(id)}`;

export const ambulanceVehicleApi = {
  create(data: CreateAmbulanceVehicleRequest): Promise<AmbulanceVehicle> {
    return unwrapData(
      api().post<ApiResponse<AmbulanceVehicle>>("/ambulance-vehicles/", data),
    );
  },

  list(): Promise<AmbulanceVehicle[]> {
    return unwrapData(
      api().get<ApiResponse<AmbulanceVehicle[]>>("/ambulance-vehicles/"),
    );
  },

  getById(id: UUID): Promise<AmbulanceVehicle> {
    return unwrapData(api().get<ApiResponse<AmbulanceVehicle>>(vehiclePath(id)));
  },

  update(
    id: UUID,
    data: UpdateAmbulanceVehicleRequest,
  ): Promise<AmbulanceVehicle> {
    return unwrapData(
      api().patch<ApiResponse<AmbulanceVehicle>>(vehiclePath(id), data),
    );
  },
};
