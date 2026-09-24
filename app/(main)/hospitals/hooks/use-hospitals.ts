"use client";

import { useCallback, useEffect, useState } from "react";
import { facilityTypeApi } from "@/entities/facility-type/api/facility-type.api";
import type {
  CreateFacilityTypeRequest,
  FacilityType,
  UpdateFacilityTypeRequest,
} from "@/entities/facility-type/model/types";
import { hospitalSicknessApi } from "@/entities/hospital-sickness/api/hospital-sickness.api";
import { hospitalApi } from "@/entities/hospital/api/hospital.api";
import type {
  CreateHospitalRequest,
  Hospital,
  UpdateHospitalRequest,
} from "@/entities/hospital/model/types";
import { sicknessApi } from "@/entities/sickness/api/sickness.api";
import type { Sickness } from "@/entities/sickness/model/types";
import { ApiError } from "@/shared/api/types";

type HospitalsSnapshot = {
  hospitals: Hospital[];
  facilityTypes: FacilityType[];
  sicknesses: Sickness[];
};

async function getHospitalsSnapshot(): Promise<HospitalsSnapshot> {
  const [hospitals, facilityTypes, sicknesses] = await Promise.all([
    hospitalApi.list(),
    facilityTypeApi.list(),
    sicknessApi.list(),
  ]);

  return {
    hospitals,
    facilityTypes: facilityTypes ?? [],
    sicknesses,
  };
}

export function getHospitalsErrorMessage(error: unknown): string {
  if (ApiError.isApiError(error)) {
    if (error.status === 409) return "Центр с таким названием уже существует.";
    if (error.status === 403) return "Недостаточно прав для выполнения операции.";
    return error.getMessage();
  }
  if (error instanceof Error) return error.message;
  return "Неизвестная ошибка";
}

export function useHospitals() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [facilityTypes, setFacilityTypes] = useState<FacilityType[]>([]);
  const [sicknesses, setSicknesses] = useState<Sickness[]>([]);
  const [hospitalSicknesses, setHospitalSicknesses] = useState<
    Record<string, Sickness[]>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    getHospitalsSnapshot()
      .then((snapshot) => {
        if (!isActive) return;
        setHospitals(snapshot.hospitals);
        setFacilityTypes(snapshot.facilityTypes);
        setSicknesses(snapshot.sicknesses);
        setError(null);
      })
      .catch((requestError: unknown) => {
        if (isActive) setError(getHospitalsErrorMessage(requestError));
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const snapshot = await getHospitalsSnapshot();
      setHospitals(snapshot.hospitals);
      setFacilityTypes(snapshot.facilityTypes);
      setSicknesses(snapshot.sicknesses);
      setHospitalSicknesses({});
      setError(null);
    } catch (requestError) {
      setError(getHospitalsErrorMessage(requestError));
      throw requestError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadHospitalSicknesses = useCallback(async (hospitalId: string) => {
    const linkedSicknesses = await hospitalSicknessApi.listSicknesses(hospitalId);
    const uniqueSicknesses = Array.from(
      new Map(linkedSicknesses.map((item) => [item.id, item])).values(),
    );
    setHospitalSicknesses((current) => ({
      ...current,
      [hospitalId]: uniqueSicknesses,
    }));
    return uniqueSicknesses;
  }, []);

  const syncSicknesses = useCallback(
    async (hospitalId: string, selectedIds: string[]) => {
      const current =
        hospitalSicknesses[hospitalId] ??
        (await hospitalSicknessApi.listSicknesses(hospitalId));
      const currentIds = new Set(current.map((item) => item.id));
      const selected = new Set(selectedIds);

      const operations = [
        ...selectedIds
          .filter((id) => !currentIds.has(id))
          .map((id) => hospitalSicknessApi.link(hospitalId, id)),
        ...current
          .filter((item) => !selected.has(item.id))
          .map((item) => hospitalSicknessApi.unlink(hospitalId, item.id)),
      ];
      const results = await Promise.allSettled(operations);
      const failed = results.find((result) => result.status === "rejected");

      if (failed) {
        await loadHospitalSicknesses(hospitalId);
        throw failed.reason;
      }

      const linked = sicknesses.filter((item) => selected.has(item.id));
      setHospitalSicknesses((state) => ({ ...state, [hospitalId]: linked }));
    },
    [hospitalSicknesses, loadHospitalSicknesses, sicknesses],
  );

  const createHospital = useCallback(
    async (data: CreateHospitalRequest, sicknessIds: string[]) => {
      const created = await hospitalApi.create(data);
      setHospitals((current) => [
        created,
        ...current.filter((hospital) => hospital.id !== created.id),
      ]);

      await Promise.all(
        sicknessIds.map((sicknessId) =>
          hospitalSicknessApi.link(created.id, sicknessId),
        ),
      );
      const selected = new Set(sicknessIds);
      setHospitalSicknesses((current) => ({
        ...current,
        [created.id]: sicknesses.filter((item) => selected.has(item.id)),
      }));

      return created;
    },
    [sicknesses],
  );

  const updateHospital = useCallback(
    async (
      id: Hospital["id"],
      data: UpdateHospitalRequest,
      sicknessIds: string[],
    ) => {
      const updated = await hospitalApi.update(id, data);
      setHospitals((current) =>
        current.map((hospital) => (hospital.id === id ? updated : hospital)),
      );
      await syncSicknesses(id, sicknessIds);
      return updated;
    },
    [syncSicknesses],
  );

  const removeHospital = useCallback(async (id: Hospital["id"]) => {
    await hospitalApi.delete(id);
    setHospitals((current) => current.filter((hospital) => hospital.id !== id));
    setHospitalSicknesses((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }, []);

  const createFacilityType = useCallback(
    async (data: CreateFacilityTypeRequest) => {
      const created = await facilityTypeApi.create(data);
      setFacilityTypes((current) => [
        ...current.filter((item) => item.id !== created.id),
        created,
      ]);
      return created;
    },
    [],
  );

  const updateFacilityType = useCallback(
    async (id: FacilityType["id"], data: UpdateFacilityTypeRequest) => {
      const updated = await facilityTypeApi.update(id, data);
      if (!updated) {
        throw new Error("Сервер не подтвердил обновление типа учреждения.");
      }
      setFacilityTypes((current) =>
        current.map((item) => (item.id === id ? updated : item)),
      );
      return updated;
    },
    [],
  );

  const removeFacilityType = useCallback(async (id: FacilityType["id"]) => {
    const result = await facilityTypeApi.delete(id);
    if (result === undefined) {
      throw new Error(
        "Сервер не подтвердил удаление. Возможно, тип используется в маршрутизации.",
      );
    }
    setFacilityTypes((current) => current.filter((item) => item.id !== id));
  }, []);

  return {
    hospitals,
    facilityTypes,
    sicknesses,
    hospitalSicknesses,
    isLoading,
    error,
    refresh,
    loadHospitalSicknesses,
    createHospital,
    updateHospital,
    removeHospital,
    createFacilityType,
    updateFacilityType,
    removeFacilityType,
  };
}
