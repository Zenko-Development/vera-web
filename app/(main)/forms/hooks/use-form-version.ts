"use client";

import { useCallback, useEffect, useState } from "react";
import type { ChecklistOption } from "@/entities/checklist-option/model/types";
import { checklistQuestionApi } from "@/entities/checklist-question/api/checklist-question.api";
import type { ChecklistQuestion } from "@/entities/checklist-question/model/types";
import { checklistResultApi } from "@/entities/checklist-result/api/checklist-result.api";
import type { ChecklistResult } from "@/entities/checklist-result/model/types";
import { checklistResultEquipmentRequirementApi } from "@/entities/checklist-result-equipment-requirement/api/checklist-result-equipment-requirement.api";
import type { ChecklistResultEquipmentRequirement } from "@/entities/checklist-result-equipment-requirement/model/types";
import { checklistResultOperatingRequirementApi } from "@/entities/checklist-result-operating-requirement/api/checklist-result-operating-requirement.api";
import type { ChecklistResultOperatingRequirement } from "@/entities/checklist-result-operating-requirement/model/types";
import { checklistResultRoutingApi } from "@/entities/checklist-result-routing/api/checklist-result-routing.api";
import type { ChecklistResultRouting } from "@/entities/checklist-result-routing/model/types";
import { checklistRuleApi } from "@/entities/checklist-rule/api/checklist-rule.api";
import type { ChecklistRule } from "@/entities/checklist-rule/model/types";
import { checklistRuleConditionApi } from "@/entities/checklist-rule-condition/api/checklist-rule-condition.api";
import type { ChecklistRuleCondition } from "@/entities/checklist-rule-condition/model/types";
import { facilityTypeApi } from "@/entities/facility-type/api/facility-type.api";
import type { FacilityType } from "@/entities/facility-type/model/types";
import { hospitalApi } from "@/entities/hospital/api/hospital.api";
import type { Hospital } from "@/entities/hospital/model/types";
import { equipmentApi } from "@/entities/equipment/api/equipment.api";
import type { Equipment } from "@/entities/equipment/model/types";
import { operatingTypeApi } from "@/entities/operating-type/api/operating-type.api";
import type { OperatingType } from "@/entities/operating-type/model/types";
import { getFormsError } from "./use-forms";
import { usePermissions } from "@/features/auth/use-permissions";

export type FormVersionData = {
  questions: ChecklistQuestion[];
  optionsByQuestion: Record<string, ChecklistOption[]>;
  results: ChecklistResult[];
  rules: ChecklistRule[];
  conditionsByRule: Record<string, ChecklistRuleCondition[]>;
  routingByResult: Record<string, ChecklistResultRouting>;
  equipmentRequirementsByResult: Record<string, ChecklistResultEquipmentRequirement[]>;
  operatingRequirementsByResult: Record<string, ChecklistResultOperatingRequirement[]>;
  equipmentTypes: Equipment[];
  operatingTypes: OperatingType[];
  hospitals: Hospital[];
  facilityTypes: FacilityType[];
  unavailableQuestionCount: number;
};

const emptyData: FormVersionData = {
  questions: [],
  optionsByQuestion: {},
  results: [],
  rules: [],
  conditionsByRule: {},
  routingByResult: {},
  equipmentRequirementsByResult: {},
  operatingRequirementsByResult: {},
  equipmentTypes: [],
  operatingTypes: [],
  hospitals: [],
  facilityTypes: [],
  unavailableQuestionCount: 0,
};

type ReferenceAccess = {
  hospitals: boolean;
  facilityTypes: boolean;
  resources: boolean;
};

async function loadVersionData(versionId: string, access: ReferenceAccess): Promise<FormVersionData> {
  const [questionsWithOptions, results, rules, hospitals, facilityTypes, equipmentTypes, operatingTypes] = await Promise.all([
    checklistQuestionApi.list(versionId),
    checklistResultApi.list(versionId),
    checklistRuleApi.list(versionId),
    access.hospitals ? hospitalApi.list() : Promise.resolve([]),
    access.facilityTypes ? facilityTypeApi.list() : Promise.resolve([]),
    access.resources ? equipmentApi.list() : Promise.resolve([]),
    access.resources ? operatingTypeApi.list() : Promise.resolve([]),
  ]);

  const [equipmentRequirementLists, operatingRequirementLists] = await Promise.all([
    Promise.all(results.map((result) => checklistResultEquipmentRequirementApi.list(result.id))),
    Promise.all(results.map((result) => checklistResultOperatingRequirementApi.list(result.id))),
  ]);
  const equipmentRequirementsByResult = Object.fromEntries(results.map((result, index) => [result.id, equipmentRequirementLists[index]]));
  const operatingRequirementsByResult = Object.fromEntries(results.map((result, index) => [result.id, operatingRequirementLists[index]]));

  const conditionLists = await Promise.all(
    rules.map((rule) => checklistRuleConditionApi.list(rule.id)),
  );
  const conditionsByRule = Object.fromEntries(
    rules.map((rule, index) => [rule.id, conditionLists[index]]),
  );

  const questions = questionsWithOptions
    .map((question) => ({
      id: question.id,
      checklist_version_id: question.checklist_version_id,
      question: question.question,
      type: question.type,
      position: question.position,
      required: question.required,
      created_at: question.created_at,
      updated_at: question.updated_at,
    }))
    .sort((left, right) => left.position - right.position);
  const optionsByQuestion = Object.fromEntries(
    questionsWithOptions.map((question) => [
      question.id,
      [...question.options].sort((left, right) => left.position - right.position),
    ]),
  );

  const routingResponses = await Promise.allSettled(
    results.map((result) =>
      checklistResultRoutingApi.getByResultId(result.id),
    ),
  );
  const routingByResult = Object.fromEntries(
    routingResponses.flatMap((response, index) =>
      response.status === "fulfilled"
        ? [[results[index].id, response.value] as const]
        : [],
    ),
  );

  return {
    questions,
    optionsByQuestion,
    results,
    rules,
    conditionsByRule,
    routingByResult,
    equipmentRequirementsByResult,
    operatingRequirementsByResult,
    equipmentTypes,
    operatingTypes,
    hospitals,
    facilityTypes: facilityTypes ?? [],
    unavailableQuestionCount: 0,
  };
}

export function useFormVersion(versionId: string | null) {
  const { can } = usePermissions();
  const canReadHospitals = can("hospital.read");
  const canReadFacilityTypes = can("facility_type.manage");
  const canReadResources = can("hospital_resource.read");
  const [data, setData] = useState<FormVersionData>(emptyData);
  const [loading, setLoading] = useState(Boolean(versionId));
  const [error, setError] = useState<string | null>(null);
  const [loadedVersionId, setLoadedVersionId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!versionId) {
      setData(emptyData);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    try {
      setData(await loadVersionData(versionId, {
        hospitals: canReadHospitals,
        facilityTypes: canReadFacilityTypes,
        resources: canReadResources,
      }));
      setLoadedVersionId(versionId);
      setError(null);
    } catch (cause) {
      setError(getFormsError(cause));
      throw cause;
    } finally {
      setLoading(false);
    }
  }, [canReadFacilityTypes, canReadHospitals, canReadResources, versionId]);

  useEffect(() => {
    let active = true;
    if (!versionId) return;

    loadVersionData(versionId, {
      hospitals: canReadHospitals,
      facilityTypes: canReadFacilityTypes,
      resources: canReadResources,
    })
      .then((nextData) => {
        if (!active) return;
        setData(nextData);
        setLoadedVersionId(versionId);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (active) {
          setLoadedVersionId(versionId);
          setError(getFormsError(cause));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [canReadFacilityTypes, canReadHospitals, canReadResources, versionId]);

  return {
    data: versionId ? data : emptyData,
    loading: versionId ? loading || loadedVersionId !== versionId : false,
    error: versionId ? error : null,
    reload,
  };
}
