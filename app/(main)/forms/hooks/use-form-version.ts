"use client";

import { useCallback, useEffect, useState } from "react";
import { checklistOptionApi } from "@/entities/checklist-option/api/checklist-option.api";
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
import {
  readKnownQuestionIds,
  rememberQuestionId,
} from "../lib/known-questions";
import { getFormsError } from "./use-forms";

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

async function loadVersionData(versionId: string): Promise<FormVersionData> {
  const [results, rules, hospitals, facilityTypes, equipmentTypes, operatingTypes] = await Promise.all([
    checklistResultApi.list(versionId),
    checklistRuleApi.list(versionId),
    hospitalApi.list(),
    facilityTypeApi.list(),
    equipmentApi.list(),
    operatingTypeApi.list(),
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

  const questionIds = new Set(readKnownQuestionIds(versionId));
  conditionLists.flat().forEach((condition) => {
    questionIds.add(condition.question_id);
  });

  const questionResponses = await Promise.allSettled(
    [...questionIds].map((id) => checklistQuestionApi.getById(id)),
  );
  const questions = questionResponses.flatMap((response) => {
    if (
      response.status !== "fulfilled" ||
      response.value.checklist_version_id !== versionId
    ) {
      return [];
    }
    rememberQuestionId(versionId, response.value.id);
    return [response.value];
  });
  questions.sort((left, right) => left.position - right.position);

  const choiceQuestions = questions.filter(
    (question) => question.type === "single" || question.type === "multiple",
  );
  const optionLists = await Promise.all(
    choiceQuestions.map((question) => checklistOptionApi.list(question.id)),
  );
  const optionsByQuestion = Object.fromEntries(
    choiceQuestions.map((question, index) => [
      question.id,
      [...optionLists[index]].sort((left, right) => left.position - right.position),
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
    unavailableQuestionCount: questionResponses.filter(
      (response) => response.status === "rejected",
    ).length,
  };
}

export function useFormVersion(versionId: string | null) {
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
      setData(await loadVersionData(versionId));
      setLoadedVersionId(versionId);
      setError(null);
    } catch (cause) {
      setError(getFormsError(cause));
      throw cause;
    } finally {
      setLoading(false);
    }
  }, [versionId]);

  useEffect(() => {
    let active = true;
    if (!versionId) return;

    loadVersionData(versionId)
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
  }, [versionId]);

  return {
    data: versionId ? data : emptyData,
    loading: versionId ? loading || loadedVersionId !== versionId : false,
    error: versionId ? error : null,
    reload,
  };
}
