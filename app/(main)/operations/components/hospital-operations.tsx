"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, Map, Plus, RefreshCw, Trash2, UsersRound, Wrench } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollFade } from "@/components/ui/scroll-fade";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { equipmentApi } from "@/entities/equipment/api/equipment.api";
import type { Equipment } from "@/entities/equipment/model/types";
import { hospitalArrivalApi } from "@/entities/hospital-arrival/api/hospital-arrival.api";
import type { HospitalArrival } from "@/entities/hospital-arrival/model/types";
import { hospitalEquipmentApi } from "@/entities/hospital-equipment/api/hospital-equipment.api";
import type { HospitalEquipment } from "@/entities/hospital-equipment/model/types";
import { hospitalOperatingRoomApi } from "@/entities/hospital-operating-room/api/hospital-operating-room.api";
import type { HospitalOperatingRoom } from "@/entities/hospital-operating-room/model/types";
import type { HospitalResourceStatus } from "@/entities/hospital-resource/model/types";
import { hospitalServiceAreaApi } from "@/entities/hospital-service-area/api/hospital-service-area.api";
import type { HospitalServiceArea, ServiceAreaPoint } from "@/entities/hospital-service-area/model/types";
import { hospitalStaffApi } from "@/entities/hospital-staff/api/hospital-staff.api";
import { hospitalApi } from "@/entities/hospital/api/hospital.api";
import type { Hospital } from "@/entities/hospital/model/types";
import { operatingTypeApi } from "@/entities/operating-type/api/operating-type.api";
import type { OperatingType } from "@/entities/operating-type/model/types";
import { userApi } from "@/entities/user/api/user.api";
import type { User } from "@/entities/user/model/types";
import { useAlert } from "@/features/alert/alert-store";
import { ApiError } from "@/shared/api/types";

type Section = "resources" | "staff" | "areas" | "arrivals";
type ResourceTarget = { kind: "equipment" | "operating" } | null;

const resourceStatusNames: Record<HospitalResourceStatus, string> = {
  available: "Доступен",
  busy: "Занят",
  unavailable: "Недоступен",
};

function message(error: unknown) {
  if (ApiError.isApiError(error)) return error.getMessage();
  return error instanceof Error ? error.message : "Неизвестная ошибка";
}

export function HospitalOperations({ fixedHospitalId }: { fixedHospitalId?: string }) {
  const showAlert = useAlert();
  const [section, setSection] = useState<Section>("resources");
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState("");
  const [equipmentTypes, setEquipmentTypes] = useState<Equipment[]>([]);
  const [operatingTypes, setOperatingTypes] = useState<OperatingType[]>([]);
  const [equipment, setEquipment] = useState<HospitalEquipment[]>([]);
  const [rooms, setRooms] = useState<HospitalOperatingRoom[]>([]);
  const [areas, setAreas] = useState<HospitalServiceArea[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [staffIds, setStaffIds] = useState<string[]>([]);
  const [arrivals, setArrivals] = useState<HospitalArrival[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resourceTarget, setResourceTarget] = useState<ResourceTarget>(null);
  const [resourceTypeId, setResourceTypeId] = useState("");
  const [resourceLabel, setResourceLabel] = useState("");
  const [staffUserId, setStaffUserId] = useState("");
  const [areaTarget, setAreaTarget] = useState<HospitalServiceArea | "new" | null>(null);
  const [areaName, setAreaName] = useState("");
  const [areaBoundary, setAreaBoundary] = useState("");
  const [areaPriority, setAreaPriority] = useState("0");
  const [areaActive, setAreaActive] = useState(true);

  const hospitalId = fixedHospitalId ?? selectedHospitalId;
  const selectedHospital = hospitals.find((item) => item.id === hospitalId);
  const equipmentNames = useMemo(() => Object.fromEntries(equipmentTypes.map((item) => [item.id, item.name])), [equipmentTypes]);
  const operatingNames = useMemo(() => Object.fromEntries(operatingTypes.map((item) => [item.id, item.name])), [operatingTypes]);
  const userNames = useMemo(() => Object.fromEntries(users.map((user) => [user.id, [user.name_last, user.name_first, user.name_middle].filter(Boolean).join(" ")])), [users]);

  const loadBase = useCallback(async () => {
    setLoading(true);
    try {
      const [nextHospitals, nextEquipment, nextOperating] = await Promise.all([
        hospitalApi.list(), equipmentApi.list(), operatingTypeApi.list(),
      ]);
      setHospitals(nextHospitals);
      setEquipmentTypes(nextEquipment);
      setOperatingTypes(nextOperating);
      setSelectedHospitalId((current) => fixedHospitalId ? current : current || nextHospitals[0]?.id || "");
      setError(null);
      hospitalServiceAreaApi.list().then(setAreas).catch(() => setAreas([]));
      userApi.list().then(setUsers).catch(() => setUsers([]));
    } catch (cause) {
      setError(message(cause));
    } finally { setLoading(false); }
  }, [fixedHospitalId]);

  const loadHospital = useCallback(async (id: string) => {
    if (!id) return;
    setLoading(true);
    try {
      const [nextEquipment, nextRooms] = await Promise.all([
        hospitalEquipmentApi.list(id), hospitalOperatingRoomApi.list(id),
      ]);
      setEquipment(nextEquipment);
      setRooms(nextRooms);
      hospitalStaffApi.listUserIds(id).then((value) => setStaffIds(value.ids)).catch(() => setStaffIds([]));
      setError(null);
    } catch (cause) { setError(message(cause)); }
    finally { setLoading(false); }
  }, []);

  const loadArrivals = useCallback(async () => {
    try { setArrivals(await hospitalArrivalApi.list()); }
    catch (cause) { setError(message(cause)); }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadBase(), 0);
    return () => window.clearTimeout(timer);
  }, [loadBase]);
  useEffect(() => {
    const timer = window.setTimeout(() => void loadHospital(hospitalId), 0);
    return () => window.clearTimeout(timer);
  }, [hospitalId, loadHospital]);
  useEffect(() => {
    if (section !== "arrivals") return;
    const initialTimer = window.setTimeout(() => void loadArrivals(), 0);
    const timer = window.setInterval(() => void loadArrivals(), 15000);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, [loadArrivals, section]);

  const changeStatus = async (kind: "equipment" | "operating", id: string, status: HospitalResourceStatus) => {
    setBusy(true);
    try {
      if (kind === "equipment") {
        const updated = await hospitalEquipmentApi.updateStatus(id, { status });
        setEquipment((current) => current.map((item) => item.id === id ? updated : item));
      } else {
        const updated = await hospitalOperatingRoomApi.updateStatus(id, { status });
        setRooms((current) => current.map((item) => item.id === id ? updated : item));
      }
    } catch (cause) { showAlert({ title: "Не удалось изменить статус", description: message(cause), type: "error" }); }
    finally { setBusy(false); }
  };

  const openResource = (kind: "equipment" | "operating") => { setResourceTarget({ kind }); setResourceTypeId(""); setResourceLabel(""); };
  const saveResource = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!resourceTarget || !hospitalId || !resourceTypeId || !resourceLabel.trim()) return; setBusy(true);
    try {
      if (resourceTarget.kind === "equipment") {
        const created = await hospitalEquipmentApi.create(hospitalId, { equipment_id: resourceTypeId, label: resourceLabel.trim() });
        setEquipment((current) => [...current, created]);
      } else {
        const created = await hospitalOperatingRoomApi.create(hospitalId, { operating_id: resourceTypeId, label: resourceLabel.trim() });
        setRooms((current) => [...current, created]);
      }
      setResourceTarget(null);
    } catch (cause) { showAlert({ title: "Не удалось добавить ресурс", description: message(cause), type: "error" }); }
    finally { setBusy(false); }
  };
  const removeResource = async (kind: "equipment" | "operating", id: string) => {
    setBusy(true);
    try {
      if (kind === "equipment") { await hospitalEquipmentApi.delete(id); setEquipment((current) => current.filter((item) => item.id !== id)); }
      else { await hospitalOperatingRoomApi.delete(id); setRooms((current) => current.filter((item) => item.id !== id)); }
    } catch (cause) { showAlert({ title: "Не удалось удалить ресурс", description: message(cause), type: "error" }); }
    finally { setBusy(false); }
  };

  const assignStaff = async () => {
    if (!hospitalId || !staffUserId) return; setBusy(true);
    try { await hospitalStaffApi.assign({ hospital_id: hospitalId, user_id: staffUserId }); setStaffIds((current) => [...new Set([...current, staffUserId])]); setStaffUserId(""); }
    catch (cause) { showAlert({ title: "Не удалось назначить сотрудника", description: message(cause), type: "error" }); }
    finally { setBusy(false); }
  };
  const revokeStaff = async (userId: string) => {
    setBusy(true); try { await hospitalStaffApi.revoke(userId, hospitalId); setStaffIds((current) => current.filter((id) => id !== userId)); }
    catch (cause) { showAlert({ title: "Не удалось удалить назначение", description: message(cause), type: "error" }); }
    finally { setBusy(false); }
  };

  const openArea = (target: HospitalServiceArea | "new") => {
    setAreaTarget(target); setAreaName(target === "new" ? "" : target.name); setAreaBoundary(target === "new" ? "" : target.boundary.map(([lat, lon]) => `${lat}, ${lon}`).join("\n")); setAreaPriority(target === "new" ? "0" : String(target.priority)); setAreaActive(target === "new" ? true : target.active);
  };
  const saveArea = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!areaTarget || !hospitalId) return;
    let boundary: ServiceAreaPoint[];
    try { boundary = areaBoundary.split("\n").filter(Boolean).map((line) => { const [lat, lon] = line.split(",").map((value) => Number(value.trim())); if (!Number.isFinite(lat) || !Number.isFinite(lon)) throw new Error(); return [lat, lon]; }); }
    catch { showAlert({ title: "Неверный формат координат", description: "Каждая строка: широта, долгота", type: "error" }); return; }
    setBusy(true);
    try {
      const body = { hospital_id: hospitalId, name: areaName.trim(), boundary, priority: Number(areaPriority), active: areaActive };
      const saved = areaTarget === "new" ? await hospitalServiceAreaApi.create(body) : await hospitalServiceAreaApi.update(areaTarget.id, body);
      setAreas((current) => [saved, ...current.filter((item) => item.id !== saved.id)]); setAreaTarget(null);
    } catch (cause) { showAlert({ title: "Не удалось сохранить зону", description: message(cause), type: "error" }); }
    finally { setBusy(false); }
  };
  const removeArea = async (id: string) => { setBusy(true); try { await hospitalServiceAreaApi.delete(id); setAreas((current) => current.filter((item) => item.id !== id)); } catch (cause) { showAlert({ title: "Не удалось удалить зону", description: message(cause), type: "error" }); } finally { setBusy(false); } };

  const hospitalAreas = areas.filter((item) => item.hospital_id === hospitalId);
  const visibleArrivals = arrivals.filter((item) => !hospitalId || item.hospital_id === hospitalId);

  return <div className="flex min-h-0 flex-1 flex-col gap-3 py-3">
    {error && <Alert variant="destructive"><AlertTitle>Ошибка загрузки</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
    <div className="rounded-xl border bg-background p-3">
      <div className="flex flex-wrap items-end gap-3 border-b pb-3">
        {!fixedHospitalId && <div className="grid gap-1.5">
          <Label htmlFor="operations-hospital">Сосудистый центр</Label>
          <Select value={hospitalId || null} onValueChange={(value) => setSelectedHospitalId(value ?? "")}><SelectTrigger id="operations-hospital" className="min-w-72"><SelectValue placeholder="Выберите центр" /></SelectTrigger><SelectContent>{hospitals.map((hospital) => <SelectItem key={hospital.id} value={hospital.id}>{hospital.name}</SelectItem>)}</SelectContent></Select>
        </div>}
        <div className="min-w-0 flex-1 pb-1"><p className="text-sm font-medium">Управление работой центра</p><p className="truncate text-xs text-muted-foreground">{selectedHospital?.address ?? "Ресурсы, сотрудники, зоны и ожидаемые прибытия"}</p></div>
        <Button size="sm" variant="outline" onClick={() => { void loadBase(); void loadHospital(hospitalId); }} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""} />Обновить</Button>
      </div>
      <nav className="mt-2 flex flex-wrap gap-1" aria-label="Разделы работы центра">{([ ["resources", "Ресурсы", Wrench], ["staff", "Сотрудники", UsersRound], ["areas", "Зоны", Map], ["arrivals", "Прибытия", Activity] ] as const).map(([id, label, Icon]) => <Button key={id} size="sm" variant={section === id ? "default" : "ghost"} onClick={() => setSection(id)}><Icon />{label}</Button>)}</nav>
    </div>
    <ScrollFade className="min-h-0 flex-1" viewportClassName="pb-6">
      {!selectedHospital && !loading ? <Empty text="Создайте или выберите больницу." /> : section === "resources" ? <div className="grid gap-4 xl:grid-cols-2"><ResourceTable title="Оборудование" items={equipment} names={equipmentNames} busy={busy} onAdd={() => openResource("equipment")} onStatus={(id, status) => void changeStatus("equipment", id, status)} onRemove={(id) => void removeResource("equipment", id)} /><ResourceTable title="Операционные" items={rooms} names={operatingNames} busy={busy} onAdd={() => openResource("operating")} onStatus={(id, status) => void changeStatus("operating", id, status)} onRemove={(id) => void removeResource("operating", id)} /></div>
      : section === "staff" ? <section className="rounded-xl border bg-background"><header className="flex flex-wrap items-center gap-2 border-b p-4"><div className="mr-auto"><h2 className="font-semibold">Назначенные сотрудники</h2><p className="text-sm text-muted-foreground">Сотрудник может быть назначен в несколько больниц</p></div><Select value={staffUserId || null} onValueChange={(value) => setStaffUserId(value ?? "")}><SelectTrigger className="w-64"><SelectValue placeholder="Выберите сотрудника" /></SelectTrigger><SelectContent>{users.filter((user) => !staffIds.includes(user.id)).map((user) => <SelectItem key={user.id} value={user.id}>{userNames[user.id] || user.user_name}</SelectItem>)}</SelectContent></Select><Button size="sm" onClick={() => void assignStaff()} disabled={!staffUserId || busy}><Plus />Назначить</Button></header>{staffIds.length ? <Table><TableBody>{staffIds.map((id) => <TableRow key={id}><TableCell className="font-medium">{userNames[id] ?? id}</TableCell><TableCell className="w-16"><Button size="icon-sm" variant="ghost" onClick={() => void revokeStaff(id)} disabled={busy}><Trash2 /></Button></TableCell></TableRow>)}</TableBody></Table> : <Empty text="Сотрудники не назначены." />}</section>
      : section === "areas" ? <section className="rounded-xl border bg-background"><header className="flex items-center justify-between border-b p-4"><div><h2 className="font-semibold">Зоны обслуживания</h2><p className="text-sm text-muted-foreground">Замкнутые WGS 84 полигоны в формате широта, долгота</p></div><Button size="sm" onClick={() => openArea("new")}><Plus />Добавить</Button></header>{hospitalAreas.length ? <Table><TableHeader><TableRow><TableHead>Название</TableHead><TableHead>Приоритет</TableHead><TableHead>Статус</TableHead><TableHead className="w-32" /></TableRow></TableHeader><TableBody>{hospitalAreas.map((area) => <TableRow key={area.id}><TableCell>{area.name}</TableCell><TableCell>{area.priority}</TableCell><TableCell>{area.active ? "Активна" : "Отключена"}</TableCell><TableCell className="flex gap-1"><Button size="sm" variant="ghost" onClick={() => openArea(area)}>Изменить</Button><Button size="icon-sm" variant="ghost" onClick={() => void removeArea(area.id)}><Trash2 /></Button></TableCell></TableRow>)}</TableBody></Table> : <Empty text="Зоны не настроены." />}</section>
      : <section className="rounded-xl border bg-background"><header className="flex items-center justify-between border-b p-4"><div><h2 className="font-semibold">Ожидаемые машины</h2><p className="text-sm text-muted-foreground">Автообновление каждые 15 секунд</p></div><Button size="sm" variant="outline" onClick={() => void loadArrivals()}><RefreshCw />Обновить</Button></header>{visibleArrivals.length ? <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">{visibleArrivals.map((arrival) => <Card key={arrival.emergency_call_id} size="sm"><CardHeader><CardTitle>{arrival.car_number}</CardTitle><CardDescription>{arrival.hospital_name}</CardDescription></CardHeader><CardContent className="space-y-1 text-sm"><p>ETA: <strong>{formatDate(arrival.estimated_arrival_at)}</strong></p><p>Расстояние: {Math.round(arrival.distance_meters / 100) / 10} км</p><p className={arrival.location_is_fresh ? "text-emerald-700" : "font-medium text-destructive"}>{arrival.location_is_fresh ? "GPS актуален" : "GPS устарел"}</p></CardContent></Card>)}</div> : <Empty text="Активных прибытий сейчас нет." />}</section>}
    </ScrollFade>

    <Dialog open={resourceTarget !== null} onOpenChange={(open) => { if (!open && !busy) setResourceTarget(null); }}><DialogContent><form className="contents" onSubmit={saveResource}><DialogHeader><DialogTitle>Добавить физический ресурс</DialogTitle><DialogDescription>{selectedHospital?.name}</DialogDescription></DialogHeader><div className="grid gap-4"><div className="grid gap-2"><Label>Тип</Label><Select value={resourceTypeId || null} onValueChange={(value) => setResourceTypeId(value ?? "")}><SelectTrigger className="w-full"><SelectValue placeholder="Выберите тип" /></SelectTrigger><SelectContent>{(resourceTarget?.kind === "equipment" ? equipmentTypes : operatingTypes).map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-2"><Label htmlFor="resource-label">Метка</Label><Input id="resource-label" value={resourceLabel} onChange={(event) => setResourceLabel(event.target.value)} placeholder="Например, КТ-01" required /></div></div><DialogFooter><Button type="button" variant="outline" onClick={() => setResourceTarget(null)}>Отмена</Button><Button type="submit" disabled={busy || !resourceTypeId || !resourceLabel.trim()}>Добавить</Button></DialogFooter></form></DialogContent></Dialog>
    <Dialog open={areaTarget !== null} onOpenChange={(open) => { if (!open && !busy) setAreaTarget(null); }}><DialogContent><form className="contents" onSubmit={saveArea}><DialogHeader><DialogTitle>{areaTarget === "new" ? "Новая зона" : "Изменить зону"}</DialogTitle><DialogDescription>Последняя точка должна повторять первую, минимум четыре строки.</DialogDescription></DialogHeader><div className="grid gap-4"><div className="grid gap-2"><Label htmlFor="area-name">Название</Label><Input id="area-name" value={areaName} onChange={(event) => setAreaName(event.target.value)} required /></div><div className="grid gap-2"><Label htmlFor="area-boundary">Координаты</Label><Textarea id="area-boundary" className="min-h-36 font-mono text-xs" value={areaBoundary} onChange={(event) => setAreaBoundary(event.target.value)} placeholder={"55.70, 37.50\n55.70, 37.70\n55.85, 37.70\n55.70, 37.50"} required /></div><div className="grid gap-2"><Label htmlFor="area-priority">Приоритет</Label><Input id="area-priority" type="number" value={areaPriority} onChange={(event) => setAreaPriority(event.target.value)} required /></div><div className="flex items-center justify-between rounded-lg border p-3"><Label htmlFor="area-active">Активна</Label><Switch id="area-active" checked={areaActive} onCheckedChange={setAreaActive} /></div></div><DialogFooter><Button type="button" variant="outline" onClick={() => setAreaTarget(null)}>Отмена</Button><Button type="submit" disabled={busy || !areaName.trim() || !areaBoundary.trim()}>Сохранить</Button></DialogFooter></form></DialogContent></Dialog>
  </div>;
}

function ResourceTable({ title, items, names, busy, onAdd, onStatus, onRemove }: { title: string; items: Array<HospitalEquipment | HospitalOperatingRoom>; names: Record<string, string>; busy: boolean; onAdd: () => void; onStatus: (id: string, status: HospitalResourceStatus) => void; onRemove: (id: string) => void }) {
  return <section className="rounded-xl border bg-background"><header className="flex items-center justify-between border-b p-4"><h2 className="font-semibold">{title}</h2><Button size="sm" onClick={onAdd}><Plus />Добавить</Button></header>{items.length ? <Table><TableHeader><TableRow><TableHead>Метка</TableHead><TableHead>Тип</TableHead><TableHead>Статус</TableHead><TableHead className="w-12" /></TableRow></TableHeader><TableBody>{items.map((item) => { const typeId = "equipment_id" in item ? item.equipment_id : item.operating_id; return <TableRow key={item.id}><TableCell className="font-medium">{item.label}</TableCell><TableCell>{names[typeId] ?? ("equipment_name" in item ? item.equipment_name : item.operating_name)}</TableCell><TableCell><Select value={item.status} onValueChange={(value) => onStatus(item.id, value as HospitalResourceStatus)} disabled={busy}><SelectTrigger size="sm"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(resourceStatusNames).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></TableCell><TableCell><Button size="icon-sm" variant="ghost" onClick={() => onRemove(item.id)} disabled={busy}><Trash2 /></Button></TableCell></TableRow>; })}</TableBody></Table> : <Empty text="Ресурсы не добавлены." />}</section>;
}
function Empty({ text }: { text: string }) { return <p className="m-4 rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">{text}</p>; }
function formatDate(value: string) { return new Date(value).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); }
