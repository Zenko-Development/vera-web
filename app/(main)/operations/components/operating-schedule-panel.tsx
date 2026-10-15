"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, LoaderCircle, Pencil, Play, Plus, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { hospitalOperatingOperationApi } from "@/entities/hospital-operating-operation/api/hospital-operating-operation.api";
import type { HospitalOperatingOperation, HospitalOperatingOperationStatus, HospitalOperatingOperationType, SaveHospitalOperatingOperationRequest } from "@/entities/hospital-operating-operation/model/types";
import type { HospitalOperatingRoom } from "@/entities/hospital-operating-room/model/types";
import { useAlert } from "@/features/alert/alert-store";
import { ApiError } from "@/shared/api/types";

const operationTypeNames: Record<HospitalOperatingOperationType, string> = {
  planned: "Плановая",
  unplanned: "Внеплановая",
};

const operationStatusNames: Record<HospitalOperatingOperationStatus, string> = {
  scheduled: "Запланирована",
  in_progress: "Выполняется",
  completed: "Завершена",
  cancelled: "Отменена",
};

type OperationTarget = HospitalOperatingOperation | "new" | null;

function errorMessage(error: unknown): string {
  if (ApiError.isApiError(error)) return error.getMessage();
  return error instanceof Error ? error.message : "Неизвестная ошибка";
}

function toLocalInput(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return shifted.toISOString().slice(0, 16);
}

function getInitialInterval() {
  const start = new Date();
  start.setMinutes(Math.ceil(start.getMinutes() / 15) * 15, 0, 0);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return { startsAt: toLocalInput(start), endsAt: toLocalInput(end) };
}

export function OperatingSchedulePanel({ rooms, onRoomStatusChanged }: { rooms: HospitalOperatingRoom[]; onRoomStatusChanged: () => Promise<void> }) {
  const showAlert = useAlert();
  const [roomId, setRoomId] = useState("");
  const [operations, setOperations] = useState<HospitalOperatingOperation[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [target, setTarget] = useState<OperationTarget>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [operationType, setOperationType] = useState<HospitalOperatingOperationType>("planned");
  const [priority, setPriority] = useState("3");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  const resolvedRoomId = rooms.some((room) => room.id === roomId)
    ? roomId
    : rooms[0]?.id ?? "";
  const selectedRoom = rooms.find((room) => room.id === resolvedRoomId);
  const sortedOperations = useMemo(
    () => [...operations].sort((left, right) => new Date(left.starts_at).getTime() - new Date(right.starts_at).getTime()),
    [operations],
  );

  const load = useCallback(async () => {
    if (!resolvedRoomId) {
      setOperations([]);
      return;
    }
    setLoading(true);
    try {
      setOperations(await hospitalOperatingOperationApi.list(resolvedRoomId));
      setError(null);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [resolvedRoomId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const openEditor = (nextTarget: Exclude<OperationTarget, null>) => {
    setTarget(nextTarget);
    if (nextTarget === "new") {
      const interval = getInitialInterval();
      setTitle("");
      setDescription("");
      setOperationType("planned");
      setPriority("3");
      setStartsAt(interval.startsAt);
      setEndsAt(interval.endsAt);
      return;
    }
    setTitle(nextTarget.title);
    setDescription(nextTarget.description ?? "");
    setOperationType(nextTarget.operation_type);
    setPriority(String(nextTarget.priority));
    setStartsAt(toLocalInput(nextTarget.starts_at));
    setEndsAt(toLocalInput(nextTarget.ends_at));
  };

  const request = (): SaveHospitalOperatingOperationRequest | null => {
    const parsedPriority = Number(priority);
    if (!title.trim() || !startsAt || !endsAt || parsedPriority < 1 || parsedPriority > 5) return null;
    const start = new Date(startsAt);
    const end = new Date(endsAt);
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) return null;
    return {
      title: title.trim(),
      description: description.trim(),
      operation_type: operationType,
      priority: parsedPriority,
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
    };
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = request();
    if (!target || !body || !resolvedRoomId) return;
    setBusy(true);
    try {
      const saved = target === "new"
        ? await hospitalOperatingOperationApi.create(resolvedRoomId, body)
        : await hospitalOperatingOperationApi.update(target.id, body);
      setOperations((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
      setTarget(null);
      showAlert({ title: target === "new" ? "Операция добавлена в расписание" : "Операция обновлена", type: "success" });
    } catch (cause) {
      showAlert({ title: "Не удалось сохранить операцию", description: errorMessage(cause), type: "error" });
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = async (
    operation: HospitalOperatingOperation,
    status: "in_progress" | "completed" | "cancelled",
  ) => {
    setBusy(true);
    try {
      const updated = await hospitalOperatingOperationApi.updateStatus(operation.id, { status });
      setOperations((current) => current.map((item) => item.id === updated.id ? updated : item));
      await onRoomStatusChanged();
      showAlert({ title: `Операция: ${operationStatusNames[updated.status].toLocaleLowerCase("ru-RU")}`, type: "success" });
    } catch (cause) {
      showAlert({ title: "Не удалось изменить состояние операции", description: errorMessage(cause), type: "error" });
    } finally {
      setBusy(false);
    }
  };

  if (rooms.length === 0) {
    return <section className="flex min-h-64 items-center justify-center rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">Сначала добавьте физическую операционную в разделе «Ресурсы».</section>;
  }

  return (
    <section className="flex min-h-full flex-col overflow-hidden rounded-xl border bg-background xl:h-full xl:min-h-0">
      <header className="flex flex-wrap items-center gap-3 border-b p-4">
        <div className="mr-auto">
          <h2 className="font-semibold">Расписание операций</h2>
          <p className="text-sm text-muted-foreground">План и текущее выполнение по каждой операционной</p>
        </div>
        <Select value={resolvedRoomId || null} onValueChange={(value) => setRoomId(value ?? "")} disabled={busy}>
          <SelectTrigger className="w-64" aria-label="Операционная"><SelectValue placeholder="Выберите операционную" /></SelectTrigger>
          <SelectContent>{rooms.map((room) => <SelectItem key={room.id} value={room.id}>{room.label} · {room.operating_name}</SelectItem>)}</SelectContent>
        </Select>
        <Button size="sm" onClick={() => openEditor("new")} disabled={!resolvedRoomId || busy}><Plus />Добавить операцию</Button>
      </header>

      {error && <Alert variant="destructive" className="m-4 mb-0"><AlertTitle>Не удалось загрузить расписание</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" />Загрузка расписания…</div>
          : sortedOperations.length === 0 ? <div className="m-4 flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center"><CalendarDays className="mb-3 size-6 text-muted-foreground" /><p className="font-medium">Расписание пусто</p><p className="mt-1 text-sm text-muted-foreground">Добавьте первую плановую или внеплановую операцию для «{selectedRoom?.label}».</p></div>
          : <Table><TableHeader><TableRow><TableHead>Время</TableHead><TableHead>Операция</TableHead><TableHead>Тип</TableHead><TableHead>Приоритет</TableHead><TableHead>Статус</TableHead><TableHead className="w-40" /></TableRow></TableHeader><TableBody>{sortedOperations.map((operation) => <TableRow key={operation.id}><TableCell className="whitespace-nowrap"><p className="font-medium">{formatDate(operation.starts_at)}</p><p className="text-xs text-muted-foreground">до {formatDate(operation.ends_at)}</p></TableCell><TableCell><p className="font-medium">{operation.title}</p>{operation.description && <p className="max-w-80 truncate text-xs text-muted-foreground">{operation.description}</p>}</TableCell><TableCell>{operationTypeNames[operation.operation_type]}</TableCell><TableCell>{operation.priority}</TableCell><TableCell><OperationStatus status={operation.status} /></TableCell><TableCell><div className="flex justify-end gap-1">{operation.status === "scheduled" && <><Button size="icon-sm" variant="ghost" aria-label="Изменить операцию" onClick={() => openEditor(operation)} disabled={busy}><Pencil /></Button><Button size="icon-sm" variant="ghost" aria-label="Начать операцию" onClick={() => void changeStatus(operation, "in_progress")} disabled={busy}><Play /></Button></>}{operation.status === "in_progress" && <Button size="icon-sm" variant="ghost" aria-label="Завершить операцию" onClick={() => void changeStatus(operation, "completed")} disabled={busy}><Check /></Button>}{(operation.status === "scheduled" || operation.status === "in_progress") && <Button size="icon-sm" variant="ghost" className="text-destructive hover:text-destructive" aria-label="Отменить операцию" onClick={() => void changeStatus(operation, "cancelled")} disabled={busy}><X /></Button>}</div></TableCell></TableRow>)}</TableBody></Table>}
      </div>

      <Dialog open={target !== null} onOpenChange={(open) => { if (!open && !busy) setTarget(null); }}>
        <DialogContent>
          <form className="contents" onSubmit={save}>
            <DialogHeader><DialogTitle>{target === "new" ? "Новая операция" : "Изменить операцию"}</DialogTitle><DialogDescription>{selectedRoom?.label}. Интервалы действующих записей не должны пересекаться.</DialogDescription></DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-2"><Label htmlFor="operation-title">Название</Label><Input id="operation-title" autoFocus required value={title} onChange={(event) => setTitle(event.target.value)} disabled={busy} /></div>
              <div className="grid gap-2"><Label htmlFor="operation-description">Описание</Label><Textarea id="operation-description" value={description} onChange={(event) => setDescription(event.target.value)} disabled={busy} /></div>
              <div className="grid gap-4 sm:grid-cols-2"><div className="grid gap-2"><Label htmlFor="operation-type">Тип</Label><Select value={operationType} onValueChange={(value) => setOperationType(value as HospitalOperatingOperationType)} disabled={busy}><SelectTrigger id="operation-type" className="w-full"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(operationTypeNames).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-2"><Label htmlFor="operation-priority">Приоритет</Label><Input id="operation-priority" type="number" min={1} max={5} required value={priority} onChange={(event) => setPriority(event.target.value)} disabled={busy} /></div></div>
              <div className="grid gap-4 sm:grid-cols-2"><div className="grid gap-2"><Label htmlFor="operation-start">Начало</Label><DateTimePicker id="operation-start" value={startsAt} onChange={setStartsAt} disabled={busy} /></div><div className="grid gap-2"><Label htmlFor="operation-end">Окончание</Label><DateTimePicker id="operation-end" value={endsAt} min={startsAt} onChange={setEndsAt} disabled={busy} /></div></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setTarget(null)} disabled={busy}>Отмена</Button><Button type="submit" disabled={busy || request() === null}>{busy && <LoaderCircle className="animate-spin" />}Сохранить</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function OperationStatus({ status }: { status: HospitalOperatingOperationStatus }) {
  const tone = status === "in_progress" ? "bg-primary/10 text-primary" : status === "completed" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : status === "cancelled" ? "bg-muted text-muted-foreground" : "bg-amber-500/10 text-amber-700 dark:text-amber-400";
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}>{operationStatusNames[status]}</span>;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}
