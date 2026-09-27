import type { FormVersionData } from "../hooks/use-form-version";

export type PublicationCheck = {
  label: string;
  valid: boolean;
  section: "builder" | "logic" | "routing";
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
      section: "builder",
    },
    {
      label: "У вопросов с выбором есть варианты",
      valid: choiceQuestionsValid,
      section: "builder",
    },
    {
      label: "Добавлен хотя бы один результат",
      valid: data.results.length > 0,
      section: "logic",
    },
    {
      label: "Добавлено хотя бы одно правило",
      valid: data.rules.length > 0,
      section: "logic",
    },
    {
      label: "Есть ровно одно резервное правило",
      valid: fallbackRules.length === 1,
      section: "logic",
    },
    {
      label: "Резервное правило проверяется последним",
      valid: fallbackPriorityValid,
      section: "logic",
    },
    {
      label: "Все правила связаны с существующими результатами",
      valid: data.rules.every((rule) =>
        data.results.some((result) => result.id === rule.result_id),
      ),
      section: "logic",
    },
    {
      label: "Для каждого результата настроена маршрутизация",
      valid:
        data.results.length > 0 &&
        data.results.every((result) => Boolean(data.routingByResult[result.id])),
      section: "routing",
    },
  ];
}

export function isReadyForPublication(data: FormVersionData): boolean {
  return getPublicationChecks(data).every((check) => check.valid);
}
