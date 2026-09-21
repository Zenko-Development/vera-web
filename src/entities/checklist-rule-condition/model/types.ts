import type { Rfc3339DateTime, UUID } from "@/shared/api/types";

export type ChecklistRuleConditionOperator =
  | "equals"
  | "not_equals"
  | "greater_than"
  | "less_than"
  | "greater_or_equal"
  | "less_or_equal";

export type ChecklistRuleCondition = {
  id: UUID;
  rule_id: UUID;
  question_id: UUID;
  option_id: UUID | null;
  operator: ChecklistRuleConditionOperator;
  value: string | null;
  position: number;
  created_at: Rfc3339DateTime;
  updated_at: Rfc3339DateTime;
};

type ConditionRequestBase<TOperator extends ChecklistRuleConditionOperator> = {
  question_id: UUID;
  operator: TOperator;
  position?: number;
};

export type OptionChecklistRuleConditionRequest = ConditionRequestBase<
  "equals" | "not_equals"
> & {
    option_id: UUID;
    value?: never;
  };

export type ValueChecklistRuleConditionRequest =
  ConditionRequestBase<ChecklistRuleConditionOperator> & {
    value: string;
    option_id?: never;
  };

export type CreateChecklistRuleConditionRequest =
  | OptionChecklistRuleConditionRequest
  | ValueChecklistRuleConditionRequest;

export type UpdateChecklistRuleConditionRequest =
  CreateChecklistRuleConditionRequest & { position: number };
