"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, ChevronLeft, ChevronRight, FileClock, LoaderCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { analyticsEmergencyCallApi } from "@/entities/analytics-emergency-call/api/analytics-emergency-call.api";
import type { AnalyticsEmergencyCall } from "@/entities/analytics-emergency-call/model/types";
import { auditEventApi } from "@/entities/audit-event/api/audit-event.api";
import type { AuditEvent } from "@/entities/audit-event/model/types";
import { ApiError } from "@/shared/api/types";

type View = "calls" | "audit";
const limit = 25;

function message(error: unknown) {
  if (ApiError.isApiError(error)) return error.getMessage();
  return error instanceof Error ? error.message : "Неизвестная ошибка";
}

export function AnalyticsWorkspace() {
  const [view, setView] = useState<View>("calls");
  const [calls, setCalls] = useState<AnalyticsEmergencyCall[]>([]);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AnalyticsEmergencyCall | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (view === "calls") setCalls(await analyticsEmergencyCallApi.list({ limit, offset }));
      else setEvents(await auditEventApi.list({ limit, offset }));
      setError(null);
    } catch (cause) { setError(message(cause)); }
    finally { setLoading(false); }
  }, [offset, view]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const openDetails = async (call: AnalyticsEmergencyCall) => {
    setSelected(call); setDetailsLoading(true);
    try { setSelected(await analyticsEmergencyCallApi.getById(call.id)); }
    catch (cause) { setError(message(cause)); }
    finally { setDetailsLoading(false); }
  };

  const itemsLength = view === "calls" ? calls.length : events.length;
  return <div className="flex min-h-0 flex-1 flex-col gap-3 py-3">
    <div className="flex items-center gap-2 rounded-xl border bg-card p-2 text-card-foreground">
      <Button size="sm" variant={view === "calls" ? "default" : "ghost"} onClick={() => { setView("calls"); setOffset(0); }}><Activity />Завершённые вызовы</Button>
      <Button size="sm" variant={view === "audit" ? "default" : "ghost"} onClick={() => { setView("audit"); setOffset(0); }}><FileClock />Журнал аудита</Button>
      <Button className="ml-auto" size="sm" variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""} />Обновить</Button>
    </div>
    {error && <Alert variant="destructive"><AlertTitle>Не удалось загрузить аналитику</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
    <section className="min-h-0 flex-1 overflow-auto rounded-xl border bg-card text-card-foreground">
      {loading ? <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="animate-spin" />Загрузка…</div>
      : view === "calls" ? <CallsTable calls={calls} onOpen={(call) => void openDetails(call)} /> : <AuditTable events={events} />}
    </section>
    <div className="flex items-center justify-end gap-2"><span className="text-sm text-muted-foreground">{itemsLength === 0 ? "Нет записей" : `${offset + 1}–${offset + itemsLength}`}</span><Button size="icon-sm" variant="outline" aria-label="Предыдущая страница" disabled={offset === 0 || loading} onClick={() => setOffset(Math.max(0, offset - limit))}><ChevronLeft /></Button><Button size="icon-sm" variant="outline" aria-label="Следующая страница" disabled={itemsLength < limit || loading} onClick={() => setOffset(offset + limit)}><ChevronRight /></Button></div>

    <Dialog open={selected !== null} onOpenChange={(open) => { if (!open) setSelected(null); }}><DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>Вызов {selected?.vehicle.car_number}</DialogTitle><DialogDescription>{selected ? formatDate(selected.completed_at) : ""}</DialogDescription></DialogHeader>{detailsLoading ? <div className="flex justify-center p-8"><LoaderCircle className="animate-spin" /></div> : selected && <div className="space-y-4"><Info title="Результат формы"><p className="font-medium">{selected.checklist_run.result.title}</p><p className="text-sm text-muted-foreground">{selected.checklist_run.result.message}</p><p className="mt-2 text-xs text-muted-foreground">Версия {selected.checklist_run.checklist_version}</p></Info><Info title="Направление">{selected.destination ? <><p>{selected.destination.selected_hospital?.name ?? "Больница не выбрана"}</p><p className="text-sm text-muted-foreground">{selected.destination.selected_hospital?.address}</p><p className="mt-2 text-xs">{routingTypeName(selected.destination.routing_type)} · {destinationStatusName(selected.destination.status)}</p></> : <p className="text-sm text-muted-foreground">Направление не сохранено.</p>}</Info>{selected.destination?.candidates && <Info title={`Кандидаты: ${selected.destination.candidates.length}`}><div className="divide-y">{selected.destination.candidates.map((candidate) => <div key={candidate.hospital_id} className="py-2"><p className="text-sm font-medium">{candidate.name}</p><p className="text-xs text-muted-foreground">{candidate.address}</p></div>)}</div></Info>}</div>}</DialogContent></Dialog>
  </div>;
}

function CallsTable({ calls, onOpen }: { calls: AnalyticsEmergencyCall[]; onOpen: (call: AnalyticsEmergencyCall) => void }) {
  if (!calls.length) return <Empty text="Завершённых вызовов пока нет." />;
  return <Table><TableHeader><TableRow><TableHead>Завершён</TableHead><TableHead>Машина</TableHead><TableHead>Результат</TableHead><TableHead>Больница</TableHead><TableHead className="w-24" /></TableRow></TableHeader><TableBody>{calls.map((call) => <TableRow key={call.id}><TableCell>{formatDate(call.completed_at)}</TableCell><TableCell className="font-medium">{call.vehicle.car_number}</TableCell><TableCell>{call.checklist_run.result.title}</TableCell><TableCell>{call.destination?.selected_hospital?.name ?? "—"}</TableCell><TableCell><Button size="sm" variant="ghost" onClick={() => onOpen(call)}>Открыть</Button></TableCell></TableRow>)}</TableBody></Table>;
}
function AuditTable({ events }: { events: AuditEvent[] }) {
  if (!events.length) return <Empty text="Событий аудита пока нет." />;
  return <Table><TableHeader><TableRow><TableHead>Время</TableHead><TableHead>Событие</TableHead><TableHead>Инициатор</TableHead><TableHead>Сущность</TableHead><TableHead>Подробности</TableHead></TableRow></TableHeader><TableBody>{events.map((event) => <TableRow key={event.id}><TableCell className="whitespace-nowrap">{formatDate(event.occurred_at)}</TableCell><TableCell className="font-medium">{auditEventName(event.event_type)}</TableCell><TableCell>{event.actor_kind === "device" ? "Планшет" : "Пользователь"}</TableCell><TableCell>{auditEntityName(event.entity_type)}</TableCell><TableCell className="max-w-80 text-sm text-muted-foreground">{auditDetails(event)}</TableCell></TableRow>)}</TableBody></Table>;
}
function Info({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-xl border p-4"><h3 className="mb-2 text-sm font-medium text-muted-foreground">{title}</h3>{children}</section>; }
function Empty({ text }: { text: string }) { return <p className="m-4 rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">{text}</p>; }
function formatDate(value: string) { return new Date(value).toLocaleString("ru-RU"); }

const routingTypeNames: Record<string, string> = {
  fixed: "Фиксированная больница",
  by_tag: "По типу учреждения",
  by_service_area: "По зоне обслуживания",
};

const destinationStatusNames: Record<string, string> = {
  selected: "Больница выбрана",
  awaiting_selection: "Ожидает выбора",
  no_candidates: "Подходящих больниц нет",
};

const resourceStatusNames: Record<string, string> = {
  available: "Доступно",
  busy: "Занято",
  unavailable: "Недоступно",
  active: "Активно",
  inactive: "Отключено",
};

function routingTypeName(value: string) {
  return routingTypeNames[value] ?? "Способ направления не определён";
}

function destinationStatusName(value: string) {
  return destinationStatusNames[value] ?? "Статус не определён";
}

function auditEventName(value: string) {
  const names: Record<string, string> = {
    "hospital_equipment.status_changed": "Изменён статус оборудования",
    "hospital_operating_room.status_changed": "Изменён статус операционной",
    "checklist_version.published": "Опубликована версия формы",
    "user.access_status_changed": "Изменён доступ пользователя",
    "user.role_changed": "Изменена роль пользователя",
    "emergency_call_destination.resolved": "Рассчитано направление вызова",
    "emergency_call_destination.selected": "Выбрана больница для вызова",
    "geo_tracking_policy.updated": "Изменена политика геопозиции",
  };
  return names[value] ?? "Системное событие";
}

function auditEntityName(value: string) {
  const names: Record<string, string> = {
    hospital_equipment: "Оборудование больницы",
    hospital_operating_room: "Операционная больницы",
    checklist_version: "Версия формы",
    user: "Пользователь",
    emergency_call_destination: "Направление вызова",
    geo_tracking_policy: "Политика геопозиции",
  };
  return names[value] ?? "Объект системы";
}

function auditDetails(event: AuditEvent) {
  const payload = event.payload;
  const previousStatus = payload.previous_status;
  const newStatus = payload.new_status;
  if (typeof previousStatus === "string" && typeof newStatus === "string") {
    return `${resourceStatusNames[previousStatus] ?? "Предыдущее состояние"} → ${resourceStatusNames[newStatus] ?? "Новое состояние"}`;
  }
  if (typeof payload.routing_type === "string" && typeof payload.status === "string") {
    return `${routingTypeName(payload.routing_type)} · ${destinationStatusName(payload.status)}`;
  }
  if (typeof payload.version === "number") return `Версия ${payload.version}`;
  if ("new_access_status" in payload) return payload.new_access_status ? "Доступ включён" : "Доступ отключён";
  if ("new_role_id" in payload) return "Назначена новая роль";
  if ("selected_hospital_id" in payload) return "Больница выбрана";
  return Object.keys(payload).length > 0 ? "Дополнительные сведения сохранены" : "—";
}
