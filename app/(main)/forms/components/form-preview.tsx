"use client";

import { useMemo, useState } from "react";
import { Check, CircleAlert, LoaderCircle, Send } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { ChecklistVersion } from "@/entities/checklist-version/model/types";
import type { FormVersionData } from "../hooks/use-form-version";
import { getPublicationChecks } from "../lib/publication-readiness";

type Answer = string | string[];
type Props = {
  version: ChecklistVersion;
  data: FormVersionData;
  publishing: boolean;
  onRequestPublish: () => void;
};

export function FormPreview({ version, data, publishing, onRequestPublish }: Props) {
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const setAnswer = (id: string, value: Answer) => setAnswers((current) => ({ ...current, [id]: value }));

  const checks = useMemo(() => getPublicationChecks(data), [data]);
  const ready = checks.every((check) => check.valid);

  return <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
    <section className="space-y-3">
      <div><h3 className="font-medium">Предпросмотр формы</h3><p className="text-xs text-muted-foreground">Проверьте порядок вопросов и варианты. Тестовые ответы не сохраняются.</p></div>
      {data.questions.length === 0 ? <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">В форме пока нет вопросов.</div> : data.questions.map((question, index) => <Card key={question.id} size="sm"><CardHeader><CardTitle>{index + 1}. {question.question}{question.required ? " *" : ""}</CardTitle><CardDescription>{question.required ? "Обязательный вопрос" : "Необязательный вопрос"}</CardDescription></CardHeader><CardContent>
        {question.type === "single" && <Field><FieldLabel htmlFor={`preview-${question.id}`}>Выберите один вариант</FieldLabel><Select value={typeof answers[question.id] === "string" ? answers[question.id] as string : null} onValueChange={(value) => setAnswer(question.id, value ?? "")}><SelectTrigger id={`preview-${question.id}`} className="w-full"><SelectValue placeholder="Выберите вариант" /></SelectTrigger><SelectContent>{(data.optionsByQuestion[question.id] ?? []).map((option) => <SelectItem key={option.id} value={option.id}>{option.label}</SelectItem>)}</SelectContent></Select></Field>}
        {question.type === "multiple" && <Field><FieldLabel>Выберите варианты</FieldLabel><div className="space-y-2">{(data.optionsByQuestion[question.id] ?? []).map((option) => { const selected = Array.isArray(answers[question.id]) ? answers[question.id] as string[] : []; return <Field key={option.id} orientation="horizontal"><Checkbox id={`preview-${option.id}`} checked={selected.includes(option.id)} onCheckedChange={(checked) => setAnswer(question.id, checked === true ? [...selected, option.id] : selected.filter((value) => value !== option.id))} /><FieldLabel htmlFor={`preview-${option.id}`}>{option.label}</FieldLabel></Field>; })}</div></Field>}
        {question.type === "text" && <Field><FieldLabel htmlFor={`preview-${question.id}`}>Ответ</FieldLabel><Textarea id={`preview-${question.id}`} value={typeof answers[question.id] === "string" ? answers[question.id] as string : ""} onChange={(event) => setAnswer(question.id, event.target.value)} /></Field>}
        {question.type === "number" && <Field><FieldLabel htmlFor={`preview-${question.id}`}>Число</FieldLabel><Input id={`preview-${question.id}`} type="number" value={typeof answers[question.id] === "string" ? answers[question.id] as string : ""} onChange={(event) => setAnswer(question.id, event.target.value)} /></Field>}
        {question.type === "boolean" && <Field orientation="horizontal"><Switch id={`preview-${question.id}`} checked={answers[question.id] === "true"} onCheckedChange={(checked) => setAnswer(question.id, checked ? "true" : "false")} /><FieldLabel htmlFor={`preview-${question.id}`}>Да</FieldLabel></Field>}
        {(question.type === "single" || question.type === "multiple") && (data.optionsByQuestion[question.id] ?? []).length === 0 && <FieldDescription>Варианты ответа не настроены.</FieldDescription>}
      </CardContent></Card>)}
    </section>

    <aside className="space-y-3 xl:sticky xl:top-0 xl:self-start">
      <Card size="sm"><CardHeader><CardTitle>Готовность к публикации</CardTitle><CardDescription>Проверки контракта Rule Engine</CardDescription></CardHeader><CardContent className="gap-2">{checks.map((check) => <div key={check.label} className="flex items-start gap-2 text-sm">{check.valid ? <Check className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" /> : <CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />}<span>{check.label}</span></div>)}</CardContent></Card>
      {data.results.length > 0 && <Card size="sm"><CardHeader><CardTitle>Итоги</CardTitle></CardHeader><CardContent>{data.results.map((result) => <div key={result.id} className="border-b py-2 last:border-0"><p className="font-medium">{result.title}</p><p className="text-xs text-muted-foreground">{result.message || "Без сообщения"}</p></div>)}</CardContent></Card>}
      {version.status === "draft" ? <Button className="w-full" size="lg" disabled={!ready || publishing} onClick={onRequestPublish}>{publishing ? <LoaderCircle className="animate-spin" /> : <Send />} Опубликовать форму</Button> : <Alert><AlertTitle>{version.status === "published" ? "Форма опубликована" : "Версия находится в архиве"}</AlertTitle><AlertDescription>{version.status === "published" ? "Она доступна приложению бригады." : "Архивную версию нельзя изменять или публиковать повторно."}</AlertDescription></Alert>}
      {!ready && version.status === "draft" && <p className="text-xs text-muted-foreground">Завершите все обязательные настройки, чтобы опубликовать форму.</p>}
    </aside>
  </div>;
}
