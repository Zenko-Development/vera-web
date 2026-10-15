"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Ambulance, ArrowRight, CalendarClock, CircleAlert, LoaderCircle, Stethoscope, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { HospitalArrival } from "@/entities/hospital-arrival/model/types";
import type { HospitalEquipment } from "@/entities/hospital-equipment/model/types";
import { hospitalOperatingOperationApi } from "@/entities/hospital-operating-operation/api/hospital-operating-operation.api";
import type { HospitalOperatingOperation } from "@/entities/hospital-operating-operation/model/types";
import type { HospitalOperatingRoom } from "@/entities/hospital-operating-room/model/types";

export type OverviewSection = "arrivals" | "schedule" | "resources";
type ScheduledOperation = HospitalOperatingOperation & { roomLabel: string };

const operationStatusNames = {
  scheduled: "Запланирована",
  in_progress: "Выполняется",
  completed: "Завершена",
  cancelled: "Отменена",
} as const;

export function HospitalOverviewPanel({
  hospitalName,
  arrivals,
  rooms,
  equipment,
  canReadArrivals,
  canReadResources,
  canManageSchedule,
  onOpenSection,
}: {
  hospitalName: string;
  arrivals: HospitalArrival[];
  rooms: HospitalOperatingRoom[];
  equipment: HospitalEquipment[];
  canReadArrivals: boolean;
  canReadResources: boolean;
  canManageSchedule: boolean;
  onOpenSection: (section: OverviewSection) => void;
}) {
  const [operations, setOperations] = useState<ScheduledOperation[]>([]);
  const [operationsLoading, setOperationsLoading] = useState(false);
  const [operationsLoadedAt, setOperationsLoadedAt] = useState(0);
  const [operationsError, setOperationsError] = useState<string | null>(null);

  const loadOperations = useCallback(async () => {
    if (!canManageSchedule || rooms.length === 0) {
      setOperations([]);
      setOperationsError(null);
      return;
    }
    setOperationsLoading(true);
    const results = await Promise.allSettled(
      rooms.map(async (room) => (await hospitalOperatingOperationApi.list(room.id)).map((operation) => ({ ...operation, roomLabel: room.label }))),
    );
    const successful = results.flatMap((result) => result.status === "fulfilled" ? result.value : []);
    const failedCount = results.filter((result) => result.status === "rejected").length;
    setOperations(successful);
    setOperationsError(failedCount === 0 ? null : failedCount === rooms.length
      ? "Не удалось получить расписание операций."
      : "Часть расписания временно недоступна.");
    setOperationsLoadedAt(Date.now());
    setOperationsLoading(false);
  }, [canManageSchedule, rooms]);

  useEffect(() => {
    const initial = window.setTimeout(() => void loadOperations(), 0);
    const interval = window.setInterval(() => void loadOperations(), 30_000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(interval);
    };
  }, [loadOperations]);

  const priorityOperations = useMemo(() => {
    return operations
      .filter((operation) => operation.status === "in_progress" || (operation.status === "scheduled" && new Date(operation.ends_at).getTime() >= operationsLoadedAt))
      .sort((left, right) => {
        if (left.status !== right.status) return left.status === "in_progress" ? -1 : 1;
        return new Date(left.starts_at).getTime() - new Date(right.starts_at).getTime() || left.priority - right.priority;
      })
      .slice(0, 5);
  }, [operations, operationsLoadedAt]);
  const sortedArrivals = useMemo(
    () => [...arrivals].sort((left, right) => new Date(left.estimated_arrival_at).getTime() - new Date(right.estimated_arrival_at).getTime()).slice(0, 5),
    [arrivals],
  );
  const readyRooms = rooms.filter((room) => room.status === "ready").length;
  const occupiedRooms = rooms.filter((room) => room.status === "occupied").length;
  const unavailableResources = equipment.filter((item) => item.status === "unavailable").length + rooms.filter((room) => room.status === "maintenance").length;
  const inProgressCount = operations.filter((operation) => operation.status === "in_progress").length;

  return (
    <section className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)] xl:grid-rows-[minmax(0,1fr)_auto]">
      {canReadArrivals && <OverviewCard title="Машины в пути" icon={Ambulance} count={arrivals.length} action="Все прибытия" onAction={() => onOpenSection("arrivals")} className="min-h-72 xl:min-h-0">
        {sortedArrivals.length ? <div className="divide-y">{sortedArrivals.map((arrival) => <div key={arrival.emergency_call_id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"><span className={arrival.location_is_fresh ? "size-2 shrink-0 rounded-full bg-emerald-500" : "size-2 shrink-0 rounded-full bg-amber-500"} /><div className="min-w-0 flex-1"><p className="truncate font-medium">{arrival.car_number}</p><p className="truncate text-xs text-muted-foreground">{arrival.hospital_name}</p></div><div className="text-right"><p className="font-semibold tabular-nums">{formatEta(arrival.estimated_travel_seconds)}</p><p className="text-xs text-muted-foreground">{formatTime(arrival.estimated_arrival_at)}</p></div></div>)}</div>
          : <Empty message="Сейчас к центру не направляются машины." />}
      </OverviewCard>}

      {canManageSchedule && <OverviewCard title="Операции сейчас и далее" icon={CalendarClock} count={inProgressCount} action="Расписание" onAction={() => onOpenSection("schedule")} className="min-h-72 xl:min-h-0">
        {operationsError && <div className="mb-3 flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive"><CircleAlert className="size-4 shrink-0" />{operationsError}</div>}
        {operationsLoading && operations.length === 0 ? <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" />Загрузка…</div>
          : priorityOperations.length ? <div className="divide-y">{priorityOperations.map((operation) => <div key={operation.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"><span className={operation.status === "in_progress" ? "flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary" : "flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"}><Stethoscope className="size-4" /></span><div className="min-w-0 flex-1"><p className="truncate font-medium">{operation.title}</p><p className="truncate text-xs text-muted-foreground">{operation.roomLabel} · приоритет {operation.priority}</p></div><div className="shrink-0 text-right"><p className={operation.status === "in_progress" ? "text-sm font-medium text-primary" : "text-sm font-medium"}>{operationStatusNames[operation.status]}</p><p className="text-xs text-muted-foreground">{formatOperationTime(operation)}</p></div></div>)}</div>
          : <Empty message="Текущих и ближайших операций нет." />}
      </OverviewCard>}

      {canReadResources && <div className="grid gap-3 sm:grid-cols-3 xl:col-span-2">
        <StatusCard label="Готовые операционные" value={`${readyRooms} / ${rooms.length}`} tone="success" />
        <StatusCard label="Операционные заняты" value={String(occupiedRooms)} tone={occupiedRooms ? "primary" : "neutral"} />
        <button type="button" onClick={() => onOpenSection("resources")} className="group flex items-center gap-3 rounded-xl border bg-card p-4 text-left transition hover:border-primary/35"><span className={unavailableResources ? "flex size-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400" : "flex size-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"}>{unavailableResources ? <CircleAlert className="size-5" /> : <Wrench className="size-5" />}</span><span className="min-w-0 flex-1"><span className="block text-2xl font-semibold tabular-nums">{unavailableResources}</span><span className="block truncate text-xs text-muted-foreground">ресурсов требуют внимания</span></span><ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5" /></button>
      </div>}

      {!canReadArrivals && !canManageSchedule && !canReadResources && <div className="col-span-full flex min-h-72 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">Для оперативного обзора роли нужны права на прибытия или ресурсы центра.</div>}
      <span className="sr-only">Оперативный обзор: {hospitalName}</span>
    </section>
  );
}

function OverviewCard({ title, icon: Icon, count, action, onAction, className, children }: { title: string; icon: typeof Ambulance; count: number; action: string; onAction: () => void; className?: string; children: ReactNode }) {
  return <article className={`flex min-h-0 flex-col overflow-hidden rounded-xl border bg-card ${className ?? ""}`}><header className="flex items-center gap-3 border-b px-4 py-3"><span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary"><Icon className="size-4" /></span><h2 className="font-semibold">{title}</h2><span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{count}</span><Button className="ml-auto" size="sm" variant="ghost" onClick={onAction}>{action}<ArrowRight /></Button></header><div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div></article>;
}

function StatusCard({ label, value, tone }: { label: string; value: string; tone: "success" | "primary" | "neutral" }) {
  const toneClass = tone === "success" ? "text-emerald-700 dark:text-emerald-400" : tone === "primary" ? "text-primary" : "text-foreground";
  return <div className="rounded-xl border bg-card p-4"><p className={`text-3xl font-semibold tracking-tight tabular-nums ${toneClass}`}>{value}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></div>;
}

function Empty({ message }: { message: string }) {
  return <div className="flex h-full min-h-32 items-center justify-center rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground">{message}</div>;
}

function formatEta(seconds: number) {
  return `${Math.max(1, Math.round(seconds / 60))} мин`;
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function formatOperationTime(operation: HospitalOperatingOperation) {
  const start = new Date(operation.starts_at);
  const end = new Date(operation.ends_at);
  if (operation.status === "in_progress") return `до ${end.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`;
  return start.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}
