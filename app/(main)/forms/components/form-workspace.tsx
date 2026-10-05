"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CircleAlert, CircleCheck, FilePenLine, LoaderCircle, Plus, RefreshCw, Send } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { checklistVersionApi } from "@/entities/checklist-version/api/checklist-version.api";
import type { ChecklistVersion } from "@/entities/checklist-version/model/types";
import type { Checklist } from "@/entities/checklist/model/types";
import { useAlert } from "@/features/alert/alert-store";
import { useUnsavedNavigation } from "@/features/unsaved-changes/unsaved-changes-provider";
import { useFormVersion } from "../hooks/use-form-version";
import { getFormsError } from "../hooks/use-forms";
import { QuestionsEditor } from "./questions-editor";
import { ResultsRulesEditor } from "./results-rules-editor";
import { ResourceRequirementsEditor } from "./resource-requirements-editor";
import { RoutingEditor } from "./routing-editor";
import { getPublicationChecks } from "../lib/publication-readiness";

type EditorStep = "builder" | "logic" | "resources" | "routing";
const steps: Array<{ id: EditorStep; label: string; short: string }> = [
  { id: "builder", label: "Конструктор", short: "Вопросы и предпросмотр" },
  { id: "logic", label: "Логика результата", short: "Результаты и правила" },
  { id: "resources", label: "Требования", short: "Оборудование и операционные" },
  { id: "routing", label: "Маршрутизация", short: "Выбор больницы" },
];

const statusNames: Record<ChecklistVersion["status"], string> = {
  draft: "Черновик",
  published: "Опубликована",
  archived: "В архиве",
};

type Props = {
  open: boolean;
  form: Checklist;
  sicknessName: string;
  onUpdateMetadata: (data: { name: string; description: string }) => Promise<void>;
  onOpenChange: (open: boolean) => void;
  onCloseComplete: () => void;
  canManage: boolean;
  canPublish: boolean;
};

export function FormWorkspace({
  open,
  form,
  sicknessName,
  onUpdateMetadata,
  onOpenChange,
  onCloseComplete,
  canManage,
  canPublish,
}: Props) {
  const showAlert = useAlert();
  const { requestNavigation } = useUnsavedNavigation();
  const [versions, setVersions] = useState<ChecklistVersion[]>([]);
  const [versionId, setVersionId] = useState<string | null>(null);
  const [step, setStep] = useState<EditorStep>("builder");
  const [versionsLoading, setVersionsLoading] = useState(true);
  const [versionsError, setVersionsError] = useState<string | null>(null);
  const [versionAction, setVersionAction] = useState<"create" | "publish" | "archive" | null>(null);
  const [readinessOpen, setReadinessOpen] = useState(false);
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);

  const selectedVersion = versions.find((version) => version.id === versionId) ?? null;
  const { data, loading: dataLoading, error: dataError, reload: reloadData } = useFormVersion(selectedVersion?.id ?? null);
  const publicationChecks = useMemo(() => getPublicationChecks(data), [data]);
  const passedChecks = publicationChecks.filter((check) => check.valid).length;
  const readyForPublication = passedChecks === publicationChecks.length;
  const currentStepIndex = steps.findIndex((item) => item.id === step);
  const isRestoringArchived = selectedVersion?.status === "archived";

  const loadVersions = useCallback(async () => {
    setVersionsLoading(true);
    try {
      let items = await checklistVersionApi.list(form.id);
      if (items.length === 0 && canManage) {
        const created = await checklistVersionApi.create(form.id);
        items = [created];
      }
      setVersions(items);
      setVersionId((current) => {
        if (current && items.some((item) => item.id === current)) return current;
        return items.find((item) => item.status === "draft")?.id ?? items[0]?.id ?? null;
      });
      setVersionsError(null);
    } catch (cause) {
      setVersionsError(getFormsError(cause));
    } finally {
      setVersionsLoading(false);
    }
  }, [canManage, form.id]);

  useEffect(() => {
    let active = true;
    checklistVersionApi
      .list(form.id)
      .then(async (items) =>
        items.length > 0 || !canManage
          ? items
          : [await checklistVersionApi.create(form.id)],
      )
      .then((items) => {
        if (!active) return;
        setVersions(items);
        setVersionId(
          items.find((item) => item.status === "draft")?.id ?? items[0]?.id ?? null,
        );
        setVersionsError(null);
      })
      .catch((cause: unknown) => {
        if (active) setVersionsError(getFormsError(cause));
      })
      .finally(() => {
        if (active) setVersionsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [canManage, form.id]);

  const createRevision = async () => {
    const activeSetup = versions.find((version) => version.status === "draft");
    if (activeSetup) {
      setVersionId(activeSetup.id);
      setStep("builder");
      return;
    }
    setVersionAction("create");
    try {
      const created = await checklistVersionApi.create(form.id);
      setVersions((current) => [created, ...current]);
      setVersionId(created.id);
      setStep("builder");
      showAlert({ title: `Редакция ${created.version} создана`, type: "success" });
    } catch (cause) {
      showAlert({ title: "Не удалось создать редакцию", description: getFormsError(cause), type: "error" });
    } finally { setVersionAction(null); }
  };

  const publish = async () => {
    if (!selectedVersion || !["draft", "archived"].includes(selectedVersion.status)) return;
    setVersionAction("publish");
    try {
      const published = await checklistVersionApi.publish(selectedVersion.id);
      setVersions((current) => current.map((version) => version.id === published.id ? published : version.status === "published" ? { ...version, status: "archived" } : version));
      setPublishConfirmOpen(false);
      showAlert({
        title: isRestoringArchived ? "Редакция снова опубликована" : "Форма опубликована",
        description: "Выбранная редакция доступна приложению бригады.",
        type: "success",
      });
    } catch (cause) {
      showAlert({ title: "Не удалось опубликовать форму", description: getFormsError(cause), type: "error" });
    } finally { setVersionAction(null); }
  };

  const requestPublish = () => {
    if (!selectedVersion || !["draft", "archived"].includes(selectedVersion.status)) return;
    if (selectedVersion.status === "draft" && !readyForPublication) {
      setReadinessOpen(true);
      return;
    }
    setPublishConfirmOpen(true);
  };

  const changeStatus = (status: string | null) => {
    if (!selectedVersion || !status || status === selectedVersion.status) return;
    if (selectedVersion.status === "draft" && status === "published") {
      requestPublish();
      return;
    }
    if (selectedVersion.status === "archived" && status === "published") {
      requestPublish();
      return;
    }
    if (selectedVersion.status === "published" && status === "archived") {
      setArchiveConfirmOpen(true);
    }
  };

  const archive = async () => {
    if (!selectedVersion || selectedVersion.status !== "published") return;
    setVersionAction("archive");
    try {
      const archived = await checklistVersionApi.archive(selectedVersion.id);
      setVersions((current) => current.map((version) => version.id === archived.id ? archived : version));
      setArchiveConfirmOpen(false);
      showAlert({ title: "Редакция перемещена в архив", type: "success" });
    } catch (cause) {
      showAlert({ title: "Не удалось архивировать редакцию", description: getFormsError(cause), type: "error" });
    } finally { setVersionAction(null); }
  };

  const busy = versionsLoading || versionAction !== null;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) onOpenChange(true);
        else if (!busy) requestNavigation(() => onOpenChange(false));
      }}
      onOpenChangeComplete={(nextOpen) => {
        if (!nextOpen) onCloseComplete();
      }}
    >
      <DialogContent
        showCloseButton={!busy}
        className="flex h-[calc(100dvh-2rem)] max-h-[960px] flex-col gap-0 overflow-hidden p-0 sm:max-w-[calc(100vw-2rem)] xl:max-w-7xl"
      >
        <div className="border-b px-5 py-4 pr-14">
          <DialogHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <DialogTitle className="text-xl">{form.name}</DialogTitle>
                <DialogDescription className="mt-1">
                  {sicknessName} · {form.description || "Без описания"}
                </DialogDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {canPublish && selectedVersion?.status === "draft" && (
                  <div className="mr-1 hidden text-right md:block">
                    <p className="text-xs font-medium">
                      Готовность: {passedChecks} из {publicationChecks.length}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {readyForPublication ? "Можно публиковать" : "Есть незавершённые настройки"}
                    </p>
                  </div>
                )}
                {canPublish && (selectedVersion?.status === "draft" || selectedVersion?.status === "archived") && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={requestPublish}
                    disabled={busy || dataLoading}
                  >
                    {versionAction === "publish" ? (
                      <LoaderCircle className="animate-spin" />
                    ) : (
                      <Send />
                    )}
                    {selectedVersion.status === "archived" ? "Опубликовать снова" : "Опубликовать"}
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b bg-muted/30 px-5 py-3">
          <Select
            value={versionId}
            onValueChange={(value) => {
              setVersionId(value);
              setStep("builder");
            }}
            disabled={versionsLoading || versions.length === 0}
          >
            <SelectTrigger className="min-w-56 bg-background" aria-label="Редакция формы">
              <SelectValue placeholder="Выберите редакцию" />
            </SelectTrigger>
            <SelectContent align="start">
              <SelectGroup>
                <SelectLabel>История редакций</SelectLabel>
                {versions.map((version) => (
                  <SelectItem key={version.id} value={version.id}>
                    Редакция {version.version} · {statusNames[version.status]}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          {selectedVersion && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Статус</span>
              <Select
                value={selectedVersion.status}
                onValueChange={changeStatus}
                disabled={busy || dataLoading || !canPublish}
              >
                <SelectTrigger
                  size="sm"
                  className={
                    selectedVersion.status === "published"
                      ? "min-w-36 border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : selectedVersion.status === "archived"
                        ? "min-w-36 bg-muted text-muted-foreground"
                        : "min-w-36 border-blue-200 bg-blue-50 text-blue-700"
                  }
                  aria-label="Изменить статус редакции"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectItem value="draft" disabled={selectedVersion.status !== "draft"}>
                    Черновик
                  </SelectItem>
                  <SelectItem value="published">
                    Опубликована
                  </SelectItem>
                  <SelectItem value="archived" disabled={selectedVersion.status === "draft"}>
                    В архиве
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {canManage && <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void createRevision()}
            disabled={busy || selectedVersion?.status === "draft"}
          >
            <Plus /> Новый черновик
          </Button>}
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            onClick={() => {
              void loadVersions();
              void reloadData().catch(() => undefined);
            }}
            disabled={busy || dataLoading}
            aria-label="Обновить данные"
          >
            <RefreshCw className={versionsLoading || dataLoading ? "animate-spin" : ""} />
          </Button>
        </div>

        {versionsError && (
          <Alert variant="destructive" className="m-4 mb-0">
            <AlertTitle>Не удалось открыть форму</AlertTitle>
            <AlertDescription>{versionsError}</AlertDescription>
          </Alert>
        )}
        {dataError && (
          <Alert variant="destructive" className="m-4 mb-0">
            <AlertTitle>Не удалось загрузить содержимое</AlertTitle>
            <AlertDescription>{dataError}</AlertDescription>
          </Alert>
        )}

        {versionsLoading || (selectedVersion && dataLoading) ? (
          <div className="flex flex-1 items-center justify-center gap-2 text-muted-foreground">
            <LoaderCircle className="size-5 animate-spin" /> Загружаем форму…
          </div>
        ) : !selectedVersion ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <FilePenLine className="mb-3 size-8 text-muted-foreground" />
            <p className="font-medium">Редакция формы недоступна</p>
            {canManage && <Button className="mt-4" onClick={() => void createRevision()} disabled={busy}>
              <Plus /> Начать настройку
            </Button>}
          </div>
        ) : (
          <>
            <nav
              className="flex shrink-0 gap-1 overflow-x-auto border-b px-5 py-2"
              aria-label="Разделы редактора"
            >
              {steps.map((item) => (
                <Button
                  key={item.id}
                  type="button"
                  size="sm"
                  variant={step === item.id ? "secondary" : "ghost"}
                  onClick={() => setStep(item.id)}
                >
                  <span className={step === item.id ? "flex size-5 items-center justify-center rounded-full bg-primary text-[11px] text-primary-foreground" : "flex size-5 items-center justify-center rounded-full bg-muted text-[11px] text-muted-foreground"}>{steps.findIndex((candidate) => candidate.id === item.id) + 1}</span>
                  <span>{item.label}</span>
                  <span className="hidden text-muted-foreground lg:inline">· {item.short}</span>
                </Button>
              ))}
            </nav>
            <main
              className={
                step === "builder"
                  ? "min-h-0 flex-1 overflow-y-auto bg-muted/35 p-4 sm:p-6"
                  : "min-h-0 flex-1 overflow-y-auto p-5"
              }
            >
              {step === "builder" && (
                <QuestionsEditor
                  key={selectedVersion.id}
                  version={selectedVersion}
                  data={data}
                  formName={form.name}
                  formDescription={form.description}
                  onUpdateMetadata={onUpdateMetadata}
                  onChanged={reloadData}
                  canManage={canManage}
                />
              )}
              {step === "logic" && (
                <ResultsRulesEditor
                  version={selectedVersion}
                  data={data}
                  onChanged={reloadData}
                  canManage={canManage}
                />
              )}
              {step === "routing" && (
                <RoutingEditor
                  version={selectedVersion}
                  data={data}
                  onChanged={reloadData}
                  canManage={canManage}
                />
              )}
              {step === "resources" && (
                <ResourceRequirementsEditor
                  version={selectedVersion}
                  data={data}
                  onChanged={reloadData}
                  canManage={canManage}
                />
              )}
            </main>
            <footer className="flex shrink-0 items-center justify-between gap-3 border-t bg-background px-5 py-3">
              <p className="text-xs text-muted-foreground">Шаг {currentStepIndex + 1} из {steps.length} · {steps[currentStepIndex].short}</p>
              <div className="flex items-center gap-2">
                <Button type="button" size="sm" variant="outline" disabled={currentStepIndex === 0} onClick={() => setStep(steps[currentStepIndex - 1].id)}>Назад</Button>
                {currentStepIndex < steps.length - 1 ? (
                  <Button type="button" size="sm" onClick={() => setStep(steps[currentStepIndex + 1].id)}>Далее: {steps[currentStepIndex + 1].label}</Button>
                ) : canPublish && selectedVersion.status === "draft" ? (
                  <Button type="button" size="sm" onClick={requestPublish} disabled={busy || dataLoading}><Send />Проверить и опубликовать</Button>
                ) : null}
              </div>
            </footer>
          </>
        )}

        <Dialog open={readinessOpen} onOpenChange={setReadinessOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Что осталось настроить</DialogTitle>
              <DialogDescription>
                Форма сохранена как черновик. Для публикации завершите обязательные пункты.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              {publicationChecks.map((check) => (
                <button key={check.label} type="button" disabled={check.valid} onClick={() => { setStep(check.section); setReadinessOpen(false); }} className="flex w-full items-start gap-3 rounded-lg border p-3 text-left text-sm transition enabled:hover:border-foreground/30 enabled:hover:bg-muted/50">
                  {check.valid ? (
                    <CircleCheck className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  )}
                  <span className="flex-1">{check.label}</span>
                  {!check.valid && <span className="text-xs text-muted-foreground">Перейти</span>}
                </button>
              ))}
            </div>
            <DialogFooter>
              <Button onClick={() => setReadinessOpen(false)}>Продолжить настройку</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={publishConfirmOpen}
          onOpenChange={(open) => {
            if (versionAction !== "publish") setPublishConfirmOpen(open);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isRestoringArchived ? "Снова опубликовать редакцию?" : "Опубликовать черновик?"}</DialogTitle>
              <DialogDescription>
                {isRestoringArchived
                  ? "Архивная редакция снова станет доступна бригадам, а текущая опубликованная редакция автоматически перейдёт в архив."
                  : "Редакция станет доступна бригадам. Текущая опубликованная редакция автоматически перейдёт в архив, а для следующих изменений потребуется создать новый черновик."}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setPublishConfirmOpen(false)}
                disabled={versionAction === "publish"}
              >
                Отмена
              </Button>
              <Button onClick={() => void publish()} disabled={versionAction === "publish"}>
                {versionAction === "publish" ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <Send />
                )}
                {isRestoringArchived ? "Опубликовать снова" : "Опубликовать"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={archiveConfirmOpen}
          onOpenChange={(open) => {
            if (versionAction !== "archive") setArchiveConfirmOpen(open);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Переместить редакцию в архив?</DialogTitle>
              <DialogDescription>
                Она перестанет быть текущей опубликованной редакцией формы. При необходимости её можно будет опубликовать снова.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setArchiveConfirmOpen(false)}
                disabled={versionAction === "archive"}
              >
                Отмена
              </Button>
              <Button
                variant="destructive"
                onClick={() => void archive()}
                disabled={versionAction === "archive"}
              >
                {versionAction === "archive" && <LoaderCircle className="animate-spin" />}
                В архив
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
