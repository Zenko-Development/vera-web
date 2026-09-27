"use client";

import { useMemo, useState } from "react";
import { GitBranch, LoaderCircle, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { checklistResultApi } from "@/entities/checklist-result/api/checklist-result.api";
import type { ChecklistResult } from "@/entities/checklist-result/model/types";
import { checklistRuleApi } from "@/entities/checklist-rule/api/checklist-rule.api";
import type { ChecklistRule } from "@/entities/checklist-rule/model/types";
import { checklistRuleConditionApi } from "@/entities/checklist-rule-condition/api/checklist-rule-condition.api";
import type { ChecklistRuleCondition, ChecklistRuleConditionOperator } from "@/entities/checklist-rule-condition/model/types";
import type { ChecklistVersion } from "@/entities/checklist-version/model/types";
import { useAlert } from "@/features/alert/alert-store";
import type { FormVersionData } from "../hooks/use-form-version";
import { getFormsError } from "../hooks/use-forms";

const operatorNames: Record<ChecklistRuleConditionOperator, string> = {
  equals: "Равно",
  not_equals: "Не равно",
  greater_than: "Больше",
  less_than: "Меньше",
  greater_or_equal: "Больше или равно",
  less_or_equal: "Меньше или равно",
};

const equalityOperators: ChecklistRuleConditionOperator[] = ["equals", "not_equals"];
const numberOperators = Object.keys(operatorNames) as ChecklistRuleConditionOperator[];

type Props = { version: ChecklistVersion; data: FormVersionData; onChanged: () => Promise<void> };
type DeleteTarget = { kind: "result" | "rule" | "condition"; id: string; label: string };

export function ResultsRulesEditor({ version, data, onChanged }: Props) {
  const showAlert = useAlert();
  const editable = version.status === "draft";
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(data.rules[0]?.id ?? null);
  const [resultForm, setResultForm] = useState<ChecklistResult | "new" | null>(null);
  const [resultTitle, setResultTitle] = useState("");
  const [resultMessage, setResultMessage] = useState("");
  const [ruleForm, setRuleForm] = useState<ChecklistRule | "new" | null>(null);
  const [ruleName, setRuleName] = useState("");
  const [ruleResultId, setRuleResultId] = useState("");
  const [rulePriority, setRulePriority] = useState("0");
  const [conditionForm, setConditionForm] = useState<ChecklistRuleCondition | "new" | null>(null);
  const [conditionQuestionId, setConditionQuestionId] = useState("");
  const [conditionOperator, setConditionOperator] = useState<ChecklistRuleConditionOperator>("equals");
  const [conditionOptionId, setConditionOptionId] = useState("");
  const [conditionValue, setConditionValue] = useState("");
  const [conditionPosition, setConditionPosition] = useState("0");
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [busy, setBusy] = useState(false);

  const selectedRule = useMemo(() => data.rules.find((rule) => rule.id === selectedRuleId) ?? null, [data.rules, selectedRuleId]);
  const conditions = selectedRule ? data.conditionsByRule[selectedRule.id] ?? [] : [];
  const selectedConditionQuestion = data.questions.find((question) => question.id === conditionQuestionId) ?? null;
  const availableOperators = selectedConditionQuestion?.type === "number" ? numberOperators : equalityOperators;

  const openResult = (item: ChecklistResult | "new") => {
    setResultForm(item);
    setResultTitle(item === "new" ? "" : item.title);
    setResultMessage(item === "new" ? "" : item.message);
  };

  const saveResult = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!resultForm || !resultTitle.trim()) return;
    setBusy(true);
    try {
      const body = { title: resultTitle.trim(), message: resultMessage.trim() };
      if (resultForm === "new") await checklistResultApi.create(version.id, body);
      else await checklistResultApi.update(resultForm.id, body);
      setResultForm(null);
      await onChanged();
      showAlert({ title: resultForm === "new" ? "Результат добавлен" : "Результат обновлён", type: "success" });
    } catch (cause) {
      showAlert({ title: "Не удалось сохранить результат", description: getFormsError(cause), type: "error" });
    } finally { setBusy(false); }
  };

  const openRule = (item: ChecklistRule | "new") => {
    setRuleForm(item);
    setRuleName(item === "new" ? "" : item.name);
    setRuleResultId(item === "new" ? data.results[0]?.id ?? "" : item.result_id);
    setRulePriority(String(item === "new" ? 0 : item.priority));
  };

  const saveRule = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const priority = Number(rulePriority);
    if (!ruleForm || !ruleName.trim() || !ruleResultId || !Number.isInteger(priority) || priority < 0 || priority > 2147483647) return;
    setBusy(true);
    try {
      const body = { name: ruleName.trim(), result_id: ruleResultId, priority };
      const saved = ruleForm === "new"
        ? await checklistRuleApi.create(version.id, body)
        : await checklistRuleApi.update(ruleForm.id, body);
      setSelectedRuleId(saved.id);
      setRuleForm(null);
      await onChanged();
      showAlert({ title: ruleForm === "new" ? "Правило добавлено" : "Правило обновлено", type: "success" });
    } catch (cause) {
      showAlert({ title: "Не удалось сохранить правило", description: getFormsError(cause), type: "error" });
    } finally { setBusy(false); }
  };

  const openCondition = (item: ChecklistRuleCondition | "new") => {
    setConditionForm(item);
    const questionId = item === "new" ? data.questions[0]?.id ?? "" : item.question_id;
    setConditionQuestionId(questionId);
    setConditionOperator(item === "new" ? "equals" : item.operator);
    setConditionOptionId(item === "new" ? "" : item.option_id ?? "");
    setConditionValue(item === "new" ? "" : item.value ?? "");
    setConditionPosition(String(item === "new" ? Math.max(-1, ...conditions.map((condition) => condition.position)) + 1 : item.position));
  };

  const saveCondition = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const position = Number(conditionPosition);
    if (!selectedRule || !conditionForm || !selectedConditionQuestion || !Number.isInteger(position) || position < 0) return;
    const isChoice = selectedConditionQuestion.type === "single" || selectedConditionQuestion.type === "multiple";
    if ((isChoice && !conditionOptionId) || (!isChoice && !conditionValue.trim())) return;

    const request = isChoice
      ? { question_id: selectedConditionQuestion.id, option_id: conditionOptionId, operator: conditionOperator as "equals" | "not_equals", position }
      : { question_id: selectedConditionQuestion.id, value: conditionValue.trim(), operator: conditionOperator, position };

    setBusy(true);
    try {
      if (conditionForm === "new") await checklistRuleConditionApi.create(selectedRule.id, request);
      else await checklistRuleConditionApi.update(conditionForm.id, request);
      setConditionForm(null);
      await onChanged();
      showAlert({ title: conditionForm === "new" ? "Условие добавлено" : "Условие обновлено", type: "success" });
    } catch (cause) {
      showAlert({ title: "Не удалось сохранить условие", description: getFormsError(cause), type: "error" });
    } finally { setBusy(false); }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      if (deleteTarget.kind === "result") await checklistResultApi.delete(deleteTarget.id);
      else if (deleteTarget.kind === "rule") await checklistRuleApi.delete(deleteTarget.id);
      else await checklistRuleConditionApi.delete(deleteTarget.id);
      if (deleteTarget.kind === "rule" && selectedRuleId === deleteTarget.id) setSelectedRuleId(null);
      setDeleteTarget(null);
      await onChanged();
      showAlert({ title: "Удалено", type: "success" });
    } catch (cause) {
      showAlert({ title: "Не удалось удалить", description: getFormsError(cause), type: "error" });
    } finally { setBusy(false); }
  };

  return <div className="grid min-h-0 gap-4 xl:grid-cols-3">
    <EntityColumn title="Результаты" description="Текст, который получит бригада" count={data.results.length} action={editable && <Button size="sm" onClick={() => openResult("new")}><Plus /> Добавить</Button>}>
      {data.results.length === 0 ? <EmptyText>Добавьте хотя бы один результат.</EmptyText> : data.results.map((result) => <div key={result.id} className="flex gap-2 border-b p-3 last:border-0"><div className="min-w-0 flex-1"><p className="font-medium">{result.title || "Без названия"}</p><p className="mt-1 text-xs text-muted-foreground">{result.message || "Без сообщения"}</p></div>{editable && <><Button size="icon-sm" variant="ghost" aria-label="Изменить результат" onClick={() => openResult(result)}><Pencil /></Button><Button size="icon-sm" variant="ghost" aria-label="Удалить результат" onClick={() => setDeleteTarget({ kind: "result", id: result.id, label: result.title })}><Trash2 /></Button></>}</div>)}
    </EntityColumn>

    <EntityColumn title="Правила" description="Проверяются по убыванию приоритета" count={data.rules.length} action={editable && <Button size="sm" variant="outline" onClick={() => openRule("new")} disabled={data.results.length === 0}><Plus /> Добавить</Button>}>
      {data.rules.length === 0 ? <EmptyText>Создайте правило и свяжите его с результатом.</EmptyText> : [...data.rules].sort((a, b) => b.priority - a.priority).map((rule) => {
        const ruleConditions = data.conditionsByRule[rule.id] ?? [];
        return <div key={rule.id} className={selectedRuleId === rule.id ? "flex gap-2 border-b bg-muted/60 p-3 last:border-0" : "flex gap-2 border-b p-3 last:border-0"}><button type="button" className="min-w-0 flex-1 text-left" onClick={() => setSelectedRuleId(rule.id)}><p className="font-medium">{rule.name}</p><p className="mt-1 text-xs text-muted-foreground">Приоритет {rule.priority} · {data.results.find((result) => result.id === rule.result_id)?.title ?? "Результат не найден"}</p><p className="mt-1 text-xs">{ruleConditions.length ? `${ruleConditions.length} усл.` : "Без условий — резерв"}</p></button>{editable && <><Button size="icon-sm" variant="ghost" aria-label="Изменить правило" onClick={() => openRule(rule)}><Pencil /></Button><Button size="icon-sm" variant="ghost" aria-label="Удалить правило" onClick={() => setDeleteTarget({ kind: "rule", id: rule.id, label: rule.name })}><Trash2 /></Button></>}</div>;
      })}
    </EntityColumn>

    <EntityColumn title="Условия" description={selectedRule ? selectedRule.name : "Выберите правило"} count={conditions.length} action={editable && selectedRule && <Button size="sm" variant="outline" onClick={() => openCondition("new")} disabled={data.questions.length === 0}><Plus /> Добавить</Button>}>
      {!selectedRule ? <EmptyText>Выберите правило в соседней колонке.</EmptyText> : conditions.length === 0 ? <div className="flex min-h-36 flex-col items-center justify-center p-4 text-center"><GitBranch className="mb-2 size-6 text-muted-foreground" /><p className="font-medium">Резервное правило</p><p className="mt-1 text-xs text-muted-foreground">Срабатывает, когда другие правила не подошли.</p></div> : [...conditions].sort((a, b) => a.position - b.position).map((condition) => {
        const question = data.questions.find((item) => item.id === condition.question_id);
        const option = condition.option_id ? (data.optionsByQuestion[condition.question_id] ?? []).find((item) => item.id === condition.option_id) : null;
        return <div key={condition.id} className="flex gap-2 border-b p-3 last:border-0"><div className="min-w-0 flex-1"><p className="font-medium">{question?.question ?? "Вопрос недоступен"}</p><p className="mt-1 text-xs text-muted-foreground">{operatorNames[condition.operator]} · {option?.label ?? condition.value ?? "—"}</p></div>{editable && <><Button size="icon-sm" variant="ghost" aria-label="Изменить условие" onClick={() => openCondition(condition)}><Pencil /></Button><Button size="icon-sm" variant="ghost" aria-label="Удалить условие" onClick={() => setDeleteTarget({ kind: "condition", id: condition.id, label: question?.question ?? "условие" })}><Trash2 /></Button></>}</div>;
      })}
    </EntityColumn>

    <ResultDialog open={resultForm !== null} item={resultForm} title={resultTitle} message={resultMessage} busy={busy} onTitleChange={setResultTitle} onMessageChange={setResultMessage} onClose={() => setResultForm(null)} onSubmit={saveResult} />
    <RuleDialog open={ruleForm !== null} item={ruleForm} name={ruleName} resultId={ruleResultId} priority={rulePriority} results={data.results} busy={busy} onNameChange={setRuleName} onResultChange={setRuleResultId} onPriorityChange={setRulePriority} onClose={() => setRuleForm(null)} onSubmit={saveRule} />
    <ConditionDialog open={conditionForm !== null} item={conditionForm} data={data} questionId={conditionQuestionId} operator={conditionOperator} optionId={conditionOptionId} value={conditionValue} position={conditionPosition} availableOperators={availableOperators} busy={busy} onQuestionChange={(value) => { setConditionQuestionId(value); setConditionOperator("equals"); setConditionOptionId(""); setConditionValue(""); }} onOperatorChange={setConditionOperator} onOptionChange={setConditionOptionId} onValueChange={setConditionValue} onPositionChange={setConditionPosition} onClose={() => setConditionForm(null)} onSubmit={saveCondition} />
    <Dialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open && !busy) setDeleteTarget(null); }}><DialogContent><DialogHeader><DialogTitle>Удалить элемент?</DialogTitle><DialogDescription>«{deleteTarget?.label}» будет удалён. Удаление результата также удалит связанные правила.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={busy}>Отмена</Button><Button variant="destructive" onClick={() => void remove()} disabled={busy}>{busy && <LoaderCircle className="animate-spin" />} Удалить</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}

function EntityColumn({ title, description, count, action, children }: { title: string; description: string; count: number; action: React.ReactNode; children: React.ReactNode }) {
  return <section className="min-w-0 overflow-hidden rounded-xl border bg-card text-card-foreground"><header className="flex min-h-16 items-center justify-between gap-3 border-b p-3"><div><h3 className="font-medium">{title} <span className="text-muted-foreground">{count}</span></h3><p className="text-xs text-muted-foreground">{description}</p></div>{action}</header><div className="max-h-[52dvh] overflow-y-auto">{children}</div></section>;
}

function EmptyText({ children }: { children: React.ReactNode }) { return <p className="m-3 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">{children}</p>; }

type ResultDialogProps = { open: boolean; item: ChecklistResult | "new" | null; title: string; message: string; busy: boolean; onTitleChange: (value: string) => void; onMessageChange: (value: string) => void; onClose: () => void; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void };
function ResultDialog(props: ResultDialogProps) { return <Dialog open={props.open} onOpenChange={(open) => { if (!open && !props.busy) props.onClose(); }}><DialogContent><form className="contents" onSubmit={props.onSubmit}><DialogHeader><DialogTitle>{props.item === "new" ? "Новый результат" : "Изменить результат"}</DialogTitle><DialogDescription>Этот текст увидит бригада после завершения формы.</DialogDescription></DialogHeader><FieldGroup className="gap-4"><Field className="gap-2"><FieldLabel htmlFor="result-title">Название</FieldLabel><Input id="result-title" value={props.title} onChange={(event) => props.onTitleChange(event.target.value)} required autoFocus /></Field><Field className="gap-2"><FieldLabel htmlFor="result-message">Сообщение</FieldLabel><Textarea id="result-message" value={props.message} onChange={(event) => props.onMessageChange(event.target.value)} /></Field></FieldGroup><DialogFooter><Button type="button" variant="outline" onClick={props.onClose} disabled={props.busy}>Отмена</Button><Button type="submit" disabled={props.busy || !props.title.trim()}>{props.busy && <LoaderCircle className="animate-spin" />} Сохранить</Button></DialogFooter></form></DialogContent></Dialog>; }

type RuleDialogProps = { open: boolean; item: ChecklistRule | "new" | null; name: string; resultId: string; priority: string; results: ChecklistResult[]; busy: boolean; onNameChange: (value: string) => void; onResultChange: (value: string) => void; onPriorityChange: (value: string) => void; onClose: () => void; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void };
function RuleDialog(props: RuleDialogProps) { return <Dialog open={props.open} onOpenChange={(open) => { if (!open && !props.busy) props.onClose(); }}><DialogContent><form className="contents" onSubmit={props.onSubmit}><DialogHeader><DialogTitle>{props.item === "new" ? "Новое правило" : "Изменить правило"}</DialogTitle><DialogDescription>Чем выше приоритет, тем раньше проверяется правило.</DialogDescription></DialogHeader><FieldGroup className="gap-4"><Field className="gap-2"><FieldLabel htmlFor="rule-name">Название</FieldLabel><Input id="rule-name" value={props.name} onChange={(event) => props.onNameChange(event.target.value)} required autoFocus /></Field><Field className="gap-2"><FieldLabel htmlFor="rule-result">Результат</FieldLabel><Select value={props.resultId || null} onValueChange={(value) => props.onResultChange(value ?? "")}><SelectTrigger id="rule-result" className="w-full"><SelectValue placeholder="Выберите результат" /></SelectTrigger><SelectContent>{props.results.map((result) => <SelectItem key={result.id} value={result.id}>{result.title || "Без названия"}</SelectItem>)}</SelectContent></Select></Field><Field className="gap-2"><FieldLabel htmlFor="rule-priority">Приоритет</FieldLabel><Input id="rule-priority" type="number" min="0" max="2147483647" step="1" value={props.priority} onChange={(event) => props.onPriorityChange(event.target.value)} required /><FieldDescription>Одно правило без условий должно иметь самый низкий приоритет.</FieldDescription></Field></FieldGroup><DialogFooter><Button type="button" variant="outline" onClick={props.onClose} disabled={props.busy}>Отмена</Button><Button type="submit" disabled={props.busy || !props.name.trim() || !props.resultId}>{props.busy && <LoaderCircle className="animate-spin" />} Сохранить</Button></DialogFooter></form></DialogContent></Dialog>; }

type ConditionDialogProps = { open: boolean; item: ChecklistRuleCondition | "new" | null; data: FormVersionData; questionId: string; operator: ChecklistRuleConditionOperator; optionId: string; value: string; position: string; availableOperators: ChecklistRuleConditionOperator[]; busy: boolean; onQuestionChange: (value: string) => void; onOperatorChange: (value: ChecklistRuleConditionOperator) => void; onOptionChange: (value: string) => void; onValueChange: (value: string) => void; onPositionChange: (value: string) => void; onClose: () => void; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void };
function ConditionDialog(props: ConditionDialogProps) {
  const question = props.data.questions.find((item) => item.id === props.questionId);
  const isChoice = question?.type === "single" || question?.type === "multiple";
  const isBoolean = question?.type === "boolean";
  return <Dialog open={props.open} onOpenChange={(open) => { if (!open && !props.busy) props.onClose(); }}><DialogContent><form className="contents" onSubmit={props.onSubmit}><DialogHeader><DialogTitle>{props.item === "new" ? "Новое условие" : "Изменить условие"}</DialogTitle><DialogDescription>Все условия одного правила должны выполниться одновременно.</DialogDescription></DialogHeader><FieldGroup className="gap-4">
    <Field className="gap-2"><FieldLabel htmlFor="condition-question">Вопрос</FieldLabel><Select value={props.questionId || null} onValueChange={(value) => props.onQuestionChange(value ?? "")}><SelectTrigger id="condition-question" className="w-full"><SelectValue placeholder="Выберите вопрос" /></SelectTrigger><SelectContent>{props.data.questions.map((item) => <SelectItem key={item.id} value={item.id}>{item.question}</SelectItem>)}</SelectContent></Select></Field>
    <Field className="gap-2"><FieldLabel htmlFor="condition-operator">Оператор</FieldLabel><Select value={props.operator} onValueChange={(value) => props.onOperatorChange(value as ChecklistRuleConditionOperator)}><SelectTrigger id="condition-operator" className="w-full"><SelectValue /></SelectTrigger><SelectContent>{props.availableOperators.map((operator) => <SelectItem key={operator} value={operator}>{operatorNames[operator]}</SelectItem>)}</SelectContent></Select></Field>
    {isChoice ? <Field className="gap-2"><FieldLabel htmlFor="condition-option">Вариант ответа</FieldLabel><Select value={props.optionId || null} onValueChange={(value) => props.onOptionChange(value ?? "")}><SelectTrigger id="condition-option" className="w-full"><SelectValue placeholder="Выберите вариант" /></SelectTrigger><SelectContent>{(props.data.optionsByQuestion[props.questionId] ?? []).map((option) => <SelectItem key={option.id} value={option.id}>{option.label}</SelectItem>)}</SelectContent></Select></Field>
      : isBoolean ? <Field className="gap-2"><FieldLabel htmlFor="condition-value">Значение</FieldLabel><Select value={props.value || null} onValueChange={(value) => props.onValueChange(value ?? "")}><SelectTrigger id="condition-value" className="w-full"><SelectValue placeholder="Выберите значение" /></SelectTrigger><SelectContent><SelectItem value="true">Да</SelectItem><SelectItem value="false">Нет</SelectItem></SelectContent></Select></Field>
      : <Field className="gap-2"><FieldLabel htmlFor="condition-value">Значение</FieldLabel><Input id="condition-value" type={question?.type === "number" ? "number" : "text"} value={props.value} onChange={(event) => props.onValueChange(event.target.value)} required /></Field>}
    <Field className="gap-2"><FieldLabel htmlFor="condition-position">Позиция</FieldLabel><Input id="condition-position" type="number" min="0" step="1" value={props.position} onChange={(event) => props.onPositionChange(event.target.value)} required /></Field>
  </FieldGroup><DialogFooter><Button type="button" variant="outline" onClick={props.onClose} disabled={props.busy}>Отмена</Button><Button type="submit" disabled={props.busy || !props.questionId || (isChoice ? !props.optionId : !props.value.trim())}>{props.busy && <LoaderCircle className="animate-spin" />} Сохранить</Button></DialogFooter></form></DialogContent></Dialog>;
}
