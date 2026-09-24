"use client";

import { useCallback, useEffect, useState } from "react";
import { checklistApi } from "@/entities/checklist/api/checklist.api";
import type { Checklist, CreateChecklistRequest, UpdateChecklistRequest } from "@/entities/checklist/model/types";
import { sicknessApi } from "@/entities/sickness/api/sickness.api";
import type {
  CreateSicknessRequest,
  Sickness,
  UpdateSicknessRequest,
} from "@/entities/sickness/model/types";
import { ApiError } from "@/shared/api/types";

export function getFormsError(error: unknown): string {
  if (ApiError.isApiError(error)) return error.getMessage();
  if (error instanceof Error) return error.message;
  return "Неизвестная ошибка";
}

export function useForms() {
  const [forms, setForms] = useState<Checklist[]>([]);
  const [sicknesses, setSicknesses] = useState<Sickness[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([checklistApi.list(), sicknessApi.list()])
      .then(([nextForms, nextSicknesses]) => {
        if (!active) return;
        setForms(nextForms);
        setSicknesses(nextSicknesses);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (active) setError(getFormsError(cause));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [nextForms, nextSicknesses] = await Promise.all([checklistApi.list(), sicknessApi.list()]);
      setForms(nextForms);
      setSicknesses(nextSicknesses);
      setError(null);
    } catch (cause) {
      setError(getFormsError(cause));
      throw cause;
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(async (data: CreateChecklistRequest) => {
    const created = await checklistApi.create(data);
    setForms((current) => [created, ...current]);
    return created;
  }, []);

  const createSickness = useCallback(async (data: CreateSicknessRequest) => {
    const created = await sicknessApi.create(data);
    setSicknesses((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name, "ru")));
    return created;
  }, []);

  const updateSickness = useCallback(
    async (id: string, data: UpdateSicknessRequest) => {
      const updated = await sicknessApi.update(id, data);
      setSicknesses((current) =>
        current
          .map((sickness) => (sickness.id === id ? updated : sickness))
          .sort((a, b) => a.name.localeCompare(b.name, "ru")),
      );
      return updated;
    },
    [],
  );

  const removeSickness = useCallback(async (id: string) => {
    await sicknessApi.delete(id);
    setSicknesses((current) =>
      current.filter((sickness) => sickness.id !== id),
    );
  }, []);

  const update = useCallback(async (id: string, data: UpdateChecklistRequest) => {
    const updated = await checklistApi.update(id, data);
    setForms((current) => current.map((form) => form.id === id ? updated : form));
    return updated;
  }, []);

  const remove = useCallback(async (id: string) => {
    await checklistApi.delete(id);
    setForms((current) => current.filter((form) => form.id !== id));
  }, []);

  return {
    forms,
    sicknesses,
    loading,
    error,
    refresh,
    create,
    createSickness,
    updateSickness,
    removeSickness,
    update,
    remove,
  };
}
