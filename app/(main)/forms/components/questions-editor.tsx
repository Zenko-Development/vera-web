"use client";

import { useMemo, useState } from "react";
import {
  CircleHelp,
  GripVertical,
  LoaderCircle,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { checklistOptionApi } from "@/entities/checklist-option/api/checklist-option.api";
import type { ChecklistOption } from "@/entities/checklist-option/model/types";
import { checklistQuestionApi } from "@/entities/checklist-question/api/checklist-question.api";
import type {
  ChecklistQuestion,
  ChecklistQuestionType,
} from "@/entities/checklist-question/model/types";
import type { ChecklistVersion } from "@/entities/checklist-version/model/types";
import { useAlert } from "@/features/alert/alert-store";
import { checklistController } from "@/features/api/controller/checklist.controller";
import type { FormVersionData } from "../hooks/use-form-version";
import { getFormsError } from "../hooks/use-forms";
import { forgetQuestionId, rememberQuestionId } from "../lib/known-questions";

const typeNames: Record<ChecklistQuestionType, string> = {
  single: "Один вариант",
  multiple: "Несколько вариантов",
  text: "Развёрнутый текст",
  number: "Число",
  boolean: "Да / нет",
};

type Props = {
  version: ChecklistVersion;
  data: FormVersionData;
  formName: string;
  formDescription: string;
  onEditMetadata: () => void;
  onChanged: () => Promise<void>;
};

type Answer = string | string[];
type DeleteTarget =
  | { kind: "question"; id: string; label: string }
  | { kind: "option"; id: string; label: string };
type DropTarget = { id: string; after: boolean } | null;
type OptionDraft = {
  questionId: string;
  item: ChecklistOption | "new";
};

export function QuestionsEditor({
  version,
  data,
  formName,
  formDescription,
  onEditMetadata,
  onChanged,
}: Props) {
  const showAlert = useAlert();
  const editable = version.status === "draft";
  const canReorder = editable && data.unavailableQuestionCount === 0;
  const [questionForm, setQuestionForm] =
    useState<ChecklistQuestion | "new" | null>(null);
  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] =
    useState<ChecklistQuestionType>("single");
  const [required, setRequired] = useState(true);
  const [optionForm, setOptionForm] = useState<OptionDraft | null>(null);
  const [optionLabel, setOptionLabel] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [questionOrder, setQuestionOrder] = useState<string[] | null>(null);
  const [optionOrders, setOptionOrders] = useState<Record<string, string[]>>({});
  const [draggingQuestionId, setDraggingQuestionId] = useState<string | null>(null);
  const [questionDropTarget, setQuestionDropTarget] = useState<DropTarget>(null);
  const [draggingOption, setDraggingOption] = useState<{
    questionId: string;
    id: string;
  } | null>(null);
  const [optionDropTarget, setOptionDropTarget] = useState<DropTarget>(null);
  const [busy, setBusy] = useState(false);

  const questions = useMemo(() => {
    if (!questionOrder) return data.questions;
    const byId = new Map(data.questions.map((question) => [question.id, question]));
    return questionOrder.flatMap((id) => {
      const question = byId.get(id);
      return question ? [question] : [];
    });
  }, [data.questions, questionOrder]);

  const optionsFor = (questionId: string) => {
    const source = data.optionsByQuestion[questionId] ?? [];
    const order = optionOrders[questionId];
    if (!order) return source;
    const byId = new Map(source.map((option) => [option.id, option]));
    return order.flatMap((id) => {
      const option = byId.get(id);
      return option ? [option] : [];
    });
  };

  const openQuestion = (question: ChecklistQuestion | "new") => {
    setQuestionForm(question);
    setQuestionText(question === "new" ? "" : question.question);
    setQuestionType(question === "new" ? "single" : question.type);
    setRequired(question === "new" ? true : question.required);
    setOptionForm(null);
  };

  const saveQuestion = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!questionForm || !questionText.trim()) return;
    setBusy(true);
    try {
      const position =
        questionForm === "new"
          ? Math.max(-1, ...data.questions.map((item) => item.position)) + 1
          : questionForm.position;
      const body = {
        question: questionText.trim(),
        type: questionType,
        position,
        required,
      };
      const saved =
        questionForm === "new"
          ? await checklistController.createQuestion(version.id, body)
          : await checklistQuestionApi.update(questionForm.id, body);
      rememberQuestionId(version.id, saved.id);
      setQuestionForm(null);
      await onChanged();
      showAlert({
        title: questionForm === "new" ? "Вопрос добавлен" : "Вопрос сохранён",
        type: "success",
      });
    } catch (cause) {
      showAlert({
        title: "Не удалось сохранить вопрос",
        description: getFormsError(cause),
        type: "error",
      });
    } finally {
      setBusy(false);
    }
  };

  const openOption = (
    questionId: string,
    item: ChecklistOption | "new",
  ) => {
    setOptionForm({ questionId, item });
    setOptionLabel(item === "new" ? "" : item.label);
  };

  const saveOption = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!optionForm || !optionLabel.trim()) return;
    setBusy(true);
    try {
      if (optionForm.item === "new") {
        const options = data.optionsByQuestion[optionForm.questionId] ?? [];
        await checklistOptionApi.create(optionForm.questionId, {
          label: optionLabel.trim(),
          value: crypto.randomUUID(),
          position: Math.max(-1, ...options.map((item) => item.position)) + 1,
        });
      } else {
        await checklistOptionApi.update(optionForm.item.id, {
          label: optionLabel.trim(),
          value: optionForm.item.value,
          position: optionForm.item.position,
        });
      }
      setOptionForm(null);
      await onChanged();
      showAlert({
        title: optionForm.item === "new" ? "Вариант добавлен" : "Вариант сохранён",
        type: "success",
      });
    } catch (cause) {
      showAlert({
        title: "Не удалось сохранить вариант",
        description: getFormsError(cause),
        type: "error",
      });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      if (deleteTarget.kind === "question") {
        await checklistQuestionApi.delete(deleteTarget.id);
        forgetQuestionId(version.id, deleteTarget.id);
        if (
          questionForm !== "new" &&
          questionForm?.id === deleteTarget.id
        ) {
          setQuestionForm(null);
        }
      } else {
        await checklistOptionApi.delete(deleteTarget.id);
      }
      setDeleteTarget(null);
      await onChanged();
      showAlert({ title: "Удалено", type: "success" });
    } catch (cause) {
      showAlert({
        title: "Не удалось удалить",
        description: getFormsError(cause),
        type: "error",
      });
    } finally {
      setBusy(false);
    }
  };

  const persistQuestionOrder = async (next: ChecklistQuestion[]) => {
    const previousOrder = questionOrder;
    setQuestionOrder(next.map((question) => question.id));
    setBusy(true);
    try {
      const temporaryStart =
        Math.max(-1, ...next.map((question) => question.position)) + next.length + 1;
      await Promise.all(
        next.map((question, index) =>
          checklistQuestionApi.update(question.id, {
            question: question.question,
            type: question.type,
            required: question.required,
            position: temporaryStart + index,
          }),
        ),
      );
      await Promise.all(
        next.map((question, index) =>
          checklistQuestionApi.update(question.id, {
            question: question.question,
            type: question.type,
            required: question.required,
            position: index,
          }),
        ),
      );
      await onChanged();
      setQuestionOrder(null);
      showAlert({ title: "Порядок вопросов сохранён", type: "success" });
    } catch (cause) {
      setQuestionOrder(previousOrder);
      await onChanged().catch(() => undefined);
      showAlert({
        title: "Не удалось изменить порядок",
        description: getFormsError(cause),
        type: "error",
      });
    } finally {
      setBusy(false);
    }
  };

  const persistOptionOrder = async (
    questionId: string,
    next: ChecklistOption[],
  ) => {
    const previousOrder = optionOrders[questionId];
    setOptionOrders((current) => ({
      ...current,
      [questionId]: next.map((option) => option.id),
    }));
    setBusy(true);
    try {
      const temporaryStart =
        Math.max(-1, ...next.map((option) => option.position)) + next.length + 1;
      await Promise.all(
        next.map((option, index) =>
          checklistOptionApi.update(option.id, {
            label: option.label,
            value: option.value,
            position: temporaryStart + index,
          }),
        ),
      );
      await Promise.all(
        next.map((option, index) =>
          checklistOptionApi.update(option.id, {
            label: option.label,
            value: option.value,
            position: index,
          }),
        ),
      );
      await onChanged();
      setOptionOrders((current) => {
        const result = { ...current };
        delete result[questionId];
        return result;
      });
      showAlert({ title: "Порядок вариантов сохранён", type: "success" });
    } catch (cause) {
      setOptionOrders((current) => {
        const result = { ...current };
        if (previousOrder) result[questionId] = previousOrder;
        else delete result[questionId];
        return result;
      });
      await onChanged().catch(() => undefined);
      showAlert({
        title: "Не удалось изменить порядок вариантов",
        description: getFormsError(cause),
        type: "error",
      });
    } finally {
      setBusy(false);
    }
  };

  const moveQuestion = (questionId: string, offset: -1 | 1) => {
    const from = questions.findIndex((question) => question.id === questionId);
    const to = from + offset;
    if (!canReorder || from < 0 || to < 0 || to >= questions.length || busy) return;
    const next = [...questions];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    void persistQuestionOrder(next);
  };

  const dropQuestion = () => {
    if (!draggingQuestionId || !questionDropTarget || busy) return;
    const next = moveItem(
      questions,
      draggingQuestionId,
      questionDropTarget.id,
      questionDropTarget.after,
    );
    setDraggingQuestionId(null);
    setQuestionDropTarget(null);
    if (next) void persistQuestionOrder(next);
  };

  const dropOption = (questionId: string) => {
    if (
      !draggingOption ||
      draggingOption.questionId !== questionId ||
      !optionDropTarget ||
      busy
    ) {
      return;
    }
    const next = moveItem(
      optionsFor(questionId),
      draggingOption.id,
      optionDropTarget.id,
      optionDropTarget.after,
    );
    setDraggingOption(null);
    setOptionDropTarget(null);
    if (next) void persistOptionOrder(questionId, next);
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 pb-16">
      <section className="rounded-2xl border bg-background p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-2xl font-semibold tracking-tight">{formName}</h2>
            { formDescription && <p className="mt-2 text-sm text-muted-foreground">
              {formDescription || "Описание формы не задано"}
            </p>}
          </div>
          {editable && (
            <Button type="button" size="sm" variant="ghost" onClick={onEditMetadata}>
              <Pencil /> Изменить
            </Button>
          )}
        </div>
      </section>

      {data.unavailableQuestionCount > 0 && (
        <Alert variant="destructive">
          <AlertTitle>Часть вопросов недоступна</AlertTitle>
          <AlertDescription>
            Не удалось загрузить {data.unavailableQuestionCount} сохранённых вопросов. Перетаскивание временно отключено, чтобы не нарушить порядок.
          </AlertDescription>
        </Alert>
      )}

      {questions.length === 0 && questionForm !== "new" ? (
        <button
          type="button"
          className="flex min-h-64 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-background p-8 text-center transition-colors hover:border-primary/50 hover:bg-primary/[0.02]"
          onClick={() => editable && openQuestion("new")}
          disabled={!editable}
        >
          <CircleHelp className="mb-4 size-9 text-muted-foreground" />
          <span className="text-lg font-medium">Добавьте первый вопрос</span>
          <span className="mt-2 max-w-md text-sm text-muted-foreground">
            Вопрос сразу появится в том виде, в котором его увидит пользователь.
          </span>
          {editable && (
            <span className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              <Plus className="size-4" /> Добавить вопрос
            </span>
          )}
        </button>
      ) : (
        <div className="space-y-3">
          {questions.map((question, index) => {
            const isEditing =
              questionForm !== "new" && questionForm?.id === question.id;
            const previewQuestion = isEditing
              ? {
                  ...question,
                  question: questionText,
                  type: questionType,
                  required,
                }
              : question;
            const isDropTarget = questionDropTarget?.id === question.id;

            return (
              <div
                key={question.id}
                className="relative pl-0 sm:pl-9"
                onDragOver={(event) => {
                  if (!draggingQuestionId || draggingQuestionId === question.id) return;
                  event.preventDefault();
                  const bounds = event.currentTarget.getBoundingClientRect();
                  setQuestionDropTarget({
                    id: question.id,
                    after: event.clientY > bounds.top + bounds.height / 2,
                  });
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  dropQuestion();
                }}
              >
                {isDropTarget && (
                  <div
                    className={
                      questionDropTarget.after
                        ? "absolute right-0 -bottom-2 left-9 z-10 h-1 rounded-full bg-primary"
                        : "absolute top-0 right-0 left-9 z-10 h-1 rounded-full bg-primary"
                    }
                  />
                )}
                {canReorder && !isEditing && (
                  <button
                    type="button"
                    draggable={!busy}
                    className="absolute top-6 left-0 hidden cursor-grab rounded-md p-1.5 text-muted-foreground hover:bg-background hover:text-foreground active:cursor-grabbing sm:block"
                    aria-label={`Переместить вопрос ${index + 1}`}
                    title="Потяните, чтобы изменить порядок. Стрелки ↑ ↓ работают с клавиатуры."
                    onDragStart={(event) => {
                      setDraggingQuestionId(question.id);
                      event.dataTransfer.effectAllowed = "move";
                    }}
                    onDragEnd={() => {
                      setDraggingQuestionId(null);
                      setQuestionDropTarget(null);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "ArrowUp") {
                        event.preventDefault();
                        moveQuestion(question.id, -1);
                      }
                      if (event.key === "ArrowDown") {
                        event.preventDefault();
                        moveQuestion(question.id, 1);
                      }
                    }}
                  >
                    <GripVertical className="size-5" />
                  </button>
                )}

                <article
                  className={
                    draggingQuestionId === question.id
                      ? "rounded-2xl border bg-background opacity-40 shadow-sm"
                      : isEditing
                        ? "rounded-2xl border-2 border-primary bg-background shadow-md"
                        : "rounded-2xl border bg-background shadow-sm transition-shadow hover:shadow-md"
                  }
                >
                  {isEditing ? (
                    <QuestionSettings
                      text={questionText}
                      type={questionType}
                      required={required}
                      busy={busy}
                      onTextChange={setQuestionText}
                      onTypeChange={setQuestionType}
                      onRequiredChange={setRequired}
                      onCancel={() => setQuestionForm(null)}
                      onSubmit={saveQuestion}
                    />
                  ) : (
                    <header className="flex items-start gap-3 p-5 pb-3">
                      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium leading-6">
                          {question.question}
                          {question.required && <span className="ml-1 text-destructive">*</span>}
                        </h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {typeNames[question.type]}
                        </p>
                      </div>
                      {editable && (
                        <div className="flex shrink-0 gap-1">
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            aria-label="Изменить вопрос"
                            onClick={() => openQuestion(question)}
                            disabled={busy}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            aria-label="Удалить вопрос"
                            onClick={() =>
                              setDeleteTarget({
                                kind: "question",
                                id: question.id,
                                label: question.question,
                              })
                            }
                            disabled={busy}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      )}
                    </header>
                  )}

                  {isEditing && questionType !== question.type ? (
                    <DraftAnswer type={questionType} />
                  ) : (
                    <QuestionAnswer
                      question={previewQuestion}
                      options={optionsFor(question.id)}
                      answer={answers[question.id]}
                      editable={editable}
                      busy={busy}
                      optionForm={optionForm}
                      optionLabel={optionLabel}
                      draggingOption={draggingOption}
                      optionDropTarget={optionDropTarget}
                      onAnswer={(value) =>
                        setAnswers((current) => ({ ...current, [question.id]: value }))
                      }
                      onAddOption={() => openOption(question.id, "new")}
                      onEditOption={(option) => openOption(question.id, option)}
                      onDeleteOption={(option) =>
                        setDeleteTarget({
                          kind: "option",
                          id: option.id,
                          label: option.label,
                        })
                      }
                      onOptionLabelChange={setOptionLabel}
                      onOptionCancel={() => setOptionForm(null)}
                      onOptionSubmit={saveOption}
                      onOptionDragStart={(option) =>
                        setDraggingOption({ questionId: question.id, id: option.id })
                      }
                      onOptionDragEnd={() => {
                        setDraggingOption(null);
                        setOptionDropTarget(null);
                      }}
                      onOptionDragOver={(event, option) => {
                        if (
                          !draggingOption ||
                          draggingOption.questionId !== question.id ||
                          draggingOption.id === option.id
                        ) {
                          return;
                        }
                        event.preventDefault();
                        const bounds = event.currentTarget.getBoundingClientRect();
                        setOptionDropTarget({
                          id: option.id,
                          after: event.clientY > bounds.top + bounds.height / 2,
                        });
                      }}
                      onOptionDrop={(event) => {
                        event.preventDefault();
                        dropOption(question.id);
                      }}
                    />
                  )}
                </article>
              </div>
            );
          })}

          {questionForm === "new" && (
            <div className="sm:pl-9">
              <article className="rounded-2xl border-2 border-primary bg-background shadow-md">
                <QuestionSettings
                  text={questionText}
                  type={questionType}
                  required={required}
                  busy={busy}
                  onTextChange={setQuestionText}
                  onTypeChange={setQuestionType}
                  onRequiredChange={setRequired}
                  onCancel={() => setQuestionForm(null)}
                  onSubmit={saveQuestion}
                />
                <DraftAnswer type={questionType} />
              </article>
            </div>
          )}
        </div>
      )}

      {editable && questions.length > 0 && questionForm !== "new" && (
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed bg-background px-5 py-6 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/[0.02] hover:text-foreground"
          onClick={() => openQuestion("new")}
          disabled={busy}
        >
          <Plus className="size-5" /> Добавить следующий вопрос
        </button>
      )}

      {!editable && (
        <p className="rounded-xl border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
          Это опубликованная или архивная редакция. Ответы выше работают как предпросмотр, изменения недоступны.
        </p>
      )}

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !busy) setDeleteTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Удалить {deleteTarget?.kind === "question" ? "вопрос" : "вариант"}?
            </DialogTitle>
            <DialogDescription>
              «{deleteTarget?.label}» будет удалён без возможности восстановления.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={busy}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={() => void remove()} disabled={busy}>
              {busy && <LoaderCircle className="animate-spin" />} Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type QuestionSettingsProps = {
  text: string;
  type: ChecklistQuestionType;
  required: boolean;
  busy: boolean;
  onTextChange: (value: string) => void;
  onTypeChange: (value: ChecklistQuestionType) => void;
  onRequiredChange: (value: boolean) => void;
  onCancel: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

function QuestionSettings(props: QuestionSettingsProps) {
  return (
    <form className="space-y-4 border-b p-5" onSubmit={props.onSubmit}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">Настройка вопроса</p>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label="Закрыть редактирование"
          onClick={props.onCancel}
          disabled={props.busy}
        >
          <X />
        </Button>
      </div>
      <Field className="gap-2">
        <FieldLabel htmlFor="question-text">Вопрос</FieldLabel>
        <Input
          id="question-text"
          value={props.text}
          onChange={(event) => props.onTextChange(event.target.value)}
          placeholder="Например: Что вас беспокоит?"
          disabled={props.busy}
          required
          autoFocus
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <Field className="gap-2">
          <FieldLabel htmlFor="question-type">Формат ответа</FieldLabel>
          <Select
            value={props.type}
            onValueChange={(value) =>
              props.onTypeChange(value as ChecklistQuestionType)
            }
            disabled={props.busy}
          >
            <SelectTrigger id="question-type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(typeNames).map(([type, name]) => (
                <SelectItem key={type} value={type}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field orientation="horizontal" className="h-9 rounded-md border px-3">
          <Checkbox
            id="question-required"
            checked={props.required}
            onCheckedChange={(checked) => props.onRequiredChange(checked === true)}
            disabled={props.busy}
          />
          <FieldLabel htmlFor="question-required">Обязательный</FieldLabel>
        </Field>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={props.onCancel} disabled={props.busy}>
          Отмена
        </Button>
        <Button type="submit" disabled={props.busy || !props.text.trim()}>
          {props.busy ? <LoaderCircle className="animate-spin" /> : <Save />} Сохранить
        </Button>
      </div>
    </form>
  );
}

type QuestionAnswerProps = {
  question: ChecklistQuestion;
  options: ChecklistOption[];
  answer: Answer | undefined;
  editable: boolean;
  busy: boolean;
  optionForm: OptionDraft | null;
  optionLabel: string;
  draggingOption: { questionId: string; id: string } | null;
  optionDropTarget: DropTarget;
  onAnswer: (value: Answer) => void;
  onAddOption: () => void;
  onEditOption: (option: ChecklistOption) => void;
  onDeleteOption: (option: ChecklistOption) => void;
  onOptionLabelChange: (value: string) => void;
  onOptionCancel: () => void;
  onOptionSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onOptionDragStart: (option: ChecklistOption) => void;
  onOptionDragEnd: () => void;
  onOptionDragOver: (
    event: React.DragEvent<HTMLDivElement>,
    option: ChecklistOption,
  ) => void;
  onOptionDrop: (event: React.DragEvent<HTMLDivElement>) => void;
};

function QuestionAnswer(props: QuestionAnswerProps) {
  const isChoice =
    props.question.type === "single" || props.question.type === "multiple";
  const selectedMultiple = Array.isArray(props.answer) ? props.answer : [];

  return (
    <div className="space-y-3 px-5 pt-2 pb-5 sm:pl-15">
      {isChoice &&
        props.options.map((option) => {
          const checked =
            props.question.type === "multiple"
              ? selectedMultiple.includes(option.id)
              : props.answer === option.id;
          const editing =
            props.optionForm?.questionId === props.question.id &&
            props.optionForm.item !== "new" &&
            props.optionForm.item.id === option.id;
          const drop = props.optionDropTarget?.id === option.id;

          return (
            <div
              key={option.id}
              className="relative"
              onDragOver={(event) => props.onOptionDragOver(event, option)}
              onDrop={props.onOptionDrop}
            >
              {drop && (
                <div
                  className={
                    props.optionDropTarget?.after
                      ? "absolute right-0 -bottom-1.5 left-0 z-10 h-0.5 bg-primary"
                      : "absolute right-0 -top-1.5 left-0 z-10 h-0.5 bg-primary"
                  }
                />
              )}
              {editing ? (
                <OptionForm
                  label={props.optionLabel}
                  busy={props.busy}
                  onLabelChange={props.onOptionLabelChange}
                  onCancel={props.onOptionCancel}
                  onSubmit={props.onOptionSubmit}
                />
              ) : (
                <div
                  className={
                    props.draggingOption?.id === option.id
                      ? "group flex items-center gap-2 rounded-lg opacity-40"
                      : "group flex items-center gap-2 rounded-lg"
                  }
                >
                  {props.editable && (
                    <button
                      type="button"
                      draggable={!props.busy}
                      className="cursor-grab rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100 focus:opacity-100 active:cursor-grabbing"
                      aria-label={`Переместить вариант ${option.label}`}
                      onDragStart={() => props.onOptionDragStart(option)}
                      onDragEnd={props.onOptionDragEnd}
                    >
                      <GripVertical className="size-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors hover:bg-muted/40"
                    onClick={() => {
                      if (props.question.type === "single") {
                        props.onAnswer(option.id);
                      } else {
                        props.onAnswer(
                          checked
                            ? selectedMultiple.filter((id) => id !== option.id)
                            : [...selectedMultiple, option.id],
                        );
                      }
                    }}
                  >
                    {props.question.type === "single" ? (
                      <span
                        className={
                          checked
                            ? "size-4 rounded-full border-[5px] border-primary"
                            : "size-4 rounded-full border border-input"
                        }
                      />
                    ) : (
                      <Checkbox checked={checked} tabIndex={-1} aria-hidden />
                    )}
                    <span className="truncate text-sm">{option.label}</span>
                  </button>
                  {props.editable && (
                    <div className="flex opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`Изменить ${option.label}`}
                        onClick={() => props.onEditOption(option)}
                        disabled={props.busy}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`Удалить ${option.label}`}
                        onClick={() => props.onDeleteOption(option)}
                        disabled={props.busy}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

      {isChoice && props.options.length === 0 && (
        <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          Добавьте варианты ответа — они сразу появятся в форме.
        </p>
      )}

      {isChoice &&
        props.optionForm?.questionId === props.question.id &&
        props.optionForm.item === "new" && (
          <OptionForm
            label={props.optionLabel}
            busy={props.busy}
            onLabelChange={props.onOptionLabelChange}
            onCancel={props.onOptionCancel}
            onSubmit={props.onOptionSubmit}
          />
        )}

      {isChoice && props.editable && !props.optionForm && (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="text-muted-foreground"
          onClick={props.onAddOption}
          disabled={props.busy}
        >
          <Plus /> Добавить вариант
        </Button>
      )}

      {props.question.type === "text" && (
        <Textarea
          value={typeof props.answer === "string" ? props.answer : ""}
          onChange={(event) => props.onAnswer(event.target.value)}
          placeholder="Введите ответ"
          className="min-h-24 resize-none"
        />
      )}
      {props.question.type === "number" && (
        <Input
          type="number"
          value={typeof props.answer === "string" ? props.answer : ""}
          onChange={(event) => props.onAnswer(event.target.value)}
          placeholder="Введите число"
          className="max-w-xs"
        />
      )}
      {props.question.type === "boolean" && (
        <div className="flex items-center gap-3 rounded-lg border px-4 py-3">
          <Switch
            checked={props.answer === "true"}
            onCheckedChange={(checked) => props.onAnswer(checked ? "true" : "false")}
          />
          <span className="text-sm">{props.answer === "true" ? "Да" : "Нет"}</span>
        </div>
      )}
    </div>
  );
}

function OptionForm({
  label,
  busy,
  onLabelChange,
  onCancel,
  onSubmit,
}: {
  label: string;
  busy: boolean;
  onLabelChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/[0.03] p-2" onSubmit={onSubmit}>
      <Input
        value={label}
        onChange={(event) => onLabelChange(event.target.value)}
        placeholder="Текст варианта"
        disabled={busy}
        autoFocus
      />
      <Button type="submit" size="icon-sm" aria-label="Сохранить вариант" disabled={busy || !label.trim()}>
        {busy ? <LoaderCircle className="animate-spin" /> : <Save />}
      </Button>
      <Button type="button" size="icon-sm" variant="ghost" aria-label="Отмена" onClick={onCancel} disabled={busy}>
        <X />
      </Button>
    </form>
  );
}

function DraftAnswer({ type }: { type: ChecklistQuestionType }) {
  if (type === "single" || type === "multiple") {
    return (
      <div className="px-5 py-4 text-sm text-muted-foreground sm:pl-15">
        Сохраните вопрос, чтобы добавить варианты ответа.
      </div>
    );
  }
  return (
    <div className="pointer-events-none px-5 py-4 opacity-60 sm:pl-15">
      {type === "text" && <Textarea placeholder="Введите ответ" className="min-h-24 resize-none" />}
      {type === "number" && <Input type="number" placeholder="Введите число" className="max-w-xs" />}
      {type === "boolean" && <div className="flex items-center gap-3 rounded-lg border px-4 py-3"><Switch /><span className="text-sm">Нет</span></div>}
    </div>
  );
}

function moveItem<T extends { id: string }>(
  items: T[],
  draggedId: string,
  targetId: string,
  after: boolean,
): T[] | null {
  const from = items.findIndex((item) => item.id === draggedId);
  const target = items.findIndex((item) => item.id === targetId);
  if (from < 0 || target < 0 || from === target) return null;

  const next = [...items];
  const [moved] = next.splice(from, 1);
  let insertionIndex = next.findIndex((item) => item.id === targetId);
  if (after) insertionIndex += 1;
  next.splice(insertionIndex, 0, moved);
  return next;
}
