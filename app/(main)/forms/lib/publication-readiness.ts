import type { FormVersionData } from "../hooks/use-form-version";

export type PublicationCheck = {
  label: string;
  valid: boolean;
};

export function getPublicationChecks(
  data: FormVersionData,
): PublicationCheck[] {
  const fallbackRules = data.rules.filter(
    (rule) => (data.conditionsByRule[rule.id] ?? []).length === 0,
  );
  const conditionalRules = data.rules.filter(
    (rule) => (data.conditionsByRule[rule.id] ?? []).length > 0,
  );
  const fallbackPriorityValid =
    fallbackRules.length === 1 &&
    conditionalRules.every(
      (rule) => fallbackRules[0].priority < rule.priority,
    );
  const choiceQuestionsValid = data.questions
    .filter(
      (question) =>
        question.type === "single" || question.type === "multiple",
    )
    .every(
      (question) => (data.optionsByQuestion[question.id] ?? []).length > 0,
    );

  return [
    {
      label: "Добавлен хотя бы один вопрос",
      valid: data.questions.length > 0,
    },
    {
      label: "У вопросов с выбором есть варианты",
      valid: choiceQuestionsValid,
    },
    {
      label: "Добавлен хотя бы один результат",
      valid: data.results.length > 0,
    },
    {
      label: "Добавлено хотя бы одно правило",
      valid: data.rules.length > 0,
    },
    {
      label: "Есть ровно одно резервное правило",
      valid: fallbackRules.length === 1,
    },
    {
      label: "Резервное правило проверяется последним",
      valid: fallbackPriorityValid,
    },
    {
      label: "Все правила связаны с существующими результатами",
      valid: data.rules.every((rule) =>
        data.results.some((result) => result.id === rule.result_id),
      ),
    },
  ];
}

export function isReadyForPublication(data: FormVersionData): boolean {
  return getPublicationChecks(data).every((check) => check.valid);
}
