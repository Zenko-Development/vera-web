"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Ambulance, Map, Plus, Search, Trash2, UsersRound, Wrench } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollFade } from "@/components/ui/scroll-fade";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import type { HospitalServiceArea, HospitalServiceAreaRequest } from "@/entities/hospital-service-area/model/types";
import { hospitalStaffApi } from "@/entities/hospital-staff/api/hospital-staff.api";
import { hospitalApi } from "@/entities/hospital/api/hospital.api";
import type { Hospital } from "@/entities/hospital/model/types";
import { operatingTypeApi } from "@/entities/operating-type/api/operating-type.api";
import type { OperatingType } from "@/entities/operating-type/model/types";
import { userApi } from "@/entities/user/api/user.api";
import type { User } from "@/entities/user/model/types";
import { useAlert } from "@/features/alert/alert-store";
import { usePermissions } from "@/features/auth/use-permissions";
import { ApiError } from "@/shared/api/types";
import { HospitalArrivalsPanel } from "./hospital-arrivals-panel";
import { ServiceAreaDialog } from "./service-area-dialog";
import { ServiceAreasPanel } from "./service-areas-panel";

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

function getUserLabel(user: User): string {
  return (
    [user.name_last, user.name_first, user.name_middle].filter(Boolean).join(" ") ||
    user.user_name
  );
}

export function HospitalOperations({ fixedHospitalId }: { fixedHospitalId?: string }) {
  const showAlert = useAlert();
  const { can, canAny } = usePermissions();
  const [section, setSection] = useState<Section>("arrivals");
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
  const [areaDialogOpen, setAreaDialogOpen] = useState(false);
  const canReadResources = can("hospital_resource.read");
  const canManageResources = can("hospital_resource.manage");
  const canChangeResourceStatus = canAny(["hospital_resource.manage", "hospital_resource.change_status"]);
  const canManageStaff = can("hospital_staff.manage");
  const canReadUsers = can("user.manage");
  const canManageAreas = can("hospital_service_area.manage");
  const canReadArrivals = can("hospital_arrival.read");
  const availableSections = useMemo(() => {
    const sections: Section[] = [];
    if (canReadArrivals) sections.push("arrivals");
    if (canReadResources) sections.push("resources");
    if (canManageStaff) sections.push("staff");
    if (canManageAreas) sections.push("areas");
    return sections;
  }, [canManageAreas, canManageStaff, canReadArrivals, canReadResources]);
  const activeSection = availableSections.includes(section) ? section : availableSections[0];

  const hospitalId = fixedHospitalId ?? selectedHospitalId;
  const selectedHospital = hospitals.find((item) => item.id === hospitalId);
  const equipmentNames = useMemo(() => Object.fromEntries(equipmentTypes.map((item) => [item.id, item.name])), [equipmentTypes]);
  const operatingNames = useMemo(() => Object.fromEntries(operatingTypes.map((item) => [item.id, item.name])), [operatingTypes]);
  const userNames = useMemo(() => Object.fromEntries(users.map((user) => [user.id, getUserLabel(user)])), [users]);

  const loadBase = useCallback(async () => {
    setLoading(true);
    try {
      const [nextHospitals, nextEquipment, nextOperating, nextAreas, nextUsers] = await Promise.all([
        hospitalApi.list(),
        canReadResources ? equipmentApi.list() : Promise.resolve([]),
        canReadResources ? operatingTypeApi.list() : Promise.resolve([]),
        canManageAreas ? hospitalServiceAreaApi.list() : Promise.resolve([]),
        canManageStaff && canReadUsers ? userApi.list() : Promise.resolve([]),
      ]);
      setHospitals(nextHospitals);
      setEquipmentTypes(nextEquipment);
      setOperatingTypes(nextOperating);
      setAreas(nextAreas);
      setUsers(nextUsers);
      setSelectedHospitalId((current) => fixedHospitalId ? current : current || nextHospitals[0]?.id || "");
      setError(null);
    } catch (cause) {
      setError(message(cause));
    } finally { setLoading(false); }
  }, [canManageAreas, canManageStaff, canReadResources, canReadUsers, fixedHospitalId]);

  const loadHospital = useCallback(async (id: string) => {
    if (!id) return;
    setLoading(true);
    try {
      const [nextEquipment, nextRooms, nextStaff] = await Promise.all([
        canReadResources ? hospitalEquipmentApi.list(id) : Promise.resolve([]),
        canReadResources ? hospitalOperatingRoomApi.list(id) : Promise.resolve([]),
        canManageStaff ? hospitalStaffApi.listUserIds(id) : Promise.resolve({ ids: [] }),
      ]);
      setEquipment(nextEquipment);
      setRooms(nextRooms);
      setStaffIds(nextStaff.ids);
      setError(null);
    } catch (cause) { setError(message(cause)); }
    finally { setLoading(false); }
  }, [canManageStaff, canReadResources]);

  const loadArrivals = useCallback(async () => {
    try { setArrivals(await hospitalArrivalApi.list()); setError(null); }
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
    if (activeSection !== "arrivals" || !canReadArrivals) return;
    const initialTimer = window.setTimeout(() => void loadArrivals(), 0);
    const timer = window.setInterval(() => void loadArrivals(), 15000);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, [activeSection, canReadArrivals, loadArrivals]);

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
      showAlert({
        title: "Статус ресурса обновлён",
        description: resourceStatusNames[status],
        type: "success",
      });
    } catch (cause) { showAlert({ title: "Не удалось изменить статус", description: message(cause), type: "error" }); }
    finally { setBusy(false); }
  };

  const openResource = (kind: "equipment" | "operating") => { setResourceTarget({ kind }); setResourceTypeId(""); setResourceLabel(""); };
  const saveResource = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!resourceTarget || !hospitalId || !resourceTypeId || !resourceLabel.trim()) return; setBusy(true);
    const resourceKind = resourceTarget.kind;
    try {
      if (resourceKind === "equipment") {
        const created = await hospitalEquipmentApi.create(hospitalId, { equipment_id: resourceTypeId, label: resourceLabel.trim() });
        setEquipment((current) => [...current, created]);
      } else {
        const created = await hospitalOperatingRoomApi.create(hospitalId, { operating_id: resourceTypeId, label: resourceLabel.trim() });
        setRooms((current) => [...current, created]);
      }
      setResourceTarget(null);
      showAlert({
        title: resourceKind === "equipment" ? "Оборудование добавлено" : "Операционная добавлена",
        description: resourceLabel.trim(),
        type: "success",
      });
    } catch (cause) { showAlert({ title: "Не удалось добавить ресурс", description: message(cause), type: "error" }); }
    finally { setBusy(false); }
  };
  const removeResource = async (kind: "equipment" | "operating", id: string) => {
    setBusy(true);
    const label = (kind === "equipment" ? equipment : rooms).find((item) => item.id === id)?.label;
    try {
      if (kind === "equipment") { await hospitalEquipmentApi.delete(id); setEquipment((current) => current.filter((item) => item.id !== id)); }
      else { await hospitalOperatingRoomApi.delete(id); setRooms((current) => current.filter((item) => item.id !== id)); }
      showAlert({ title: "Ресурс удалён", description: label, type: "success" });
    } catch (cause) { showAlert({ title: "Не удалось удалить ресурс", description: message(cause), type: "error" }); }
    finally { setBusy(false); }
  };

  const assignStaff = async () => {
    if (!hospitalId || !staffUserId) return; setBusy(true);
    const userId = staffUserId;
    try { await hospitalStaffApi.assign({ hospital_id: hospitalId, user_id: userId }); setStaffIds((current) => [...new Set([...current, userId])]); setStaffUserId(""); showAlert({ title: "Сотрудник назначен", description: userNames[userId] ?? userId, type: "success" }); }
    catch (cause) { showAlert({ title: "Не удалось назначить сотрудника", description: message(cause), type: "error" }); }
    finally { setBusy(false); }
  };
  const revokeStaff = async (userId: string) => {
    setBusy(true); try { await hospitalStaffApi.revoke(userId, hospitalId); setStaffIds((current) => current.filter((id) => id !== userId)); showAlert({ title: "Назначение удалено", description: userNames[userId] ?? userId, type: "success" }); }
    catch (cause) { showAlert({ title: "Не удалось удалить назначение", description: message(cause), type: "error" }); }
    finally { setBusy(false); }
  };

  const openArea = (target: HospitalServiceArea | "new") => {
    setAreaTarget(target);
    setAreaDialogOpen(true);
  };
  const saveArea = async (body: HospitalServiceAreaRequest) => {
    if (!areaTarget || !hospitalId) return false;
    const isCreating = areaTarget === "new";
    setBusy(true);
    try {
      const saved = isCreating ? await hospitalServiceAreaApi.create(body) : await hospitalServiceAreaApi.update(areaTarget.id, body);
      setAreas((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
      setAreaDialogOpen(false);
      showAlert({ title: isCreating ? "Зона создана" : "Зона обновлена", description: saved.name, type: "success" });
      return true;
    } catch (cause) { showAlert({ title: "Не удалось сохранить зону", description: message(cause), type: "error" }); return false; }
    finally { setBusy(false); }
  };
  const removeArea = async (area: HospitalServiceArea) => { setBusy(true); try { await hospitalServiceAreaApi.delete(area.id); setAreas((current) => current.filter((item) => item.id !== area.id)); showAlert({ title: "Зона удалена", description: area.name, type: "success" }); } catch (cause) { showAlert({ title: "Не удалось удалить зону", description: message(cause), type: "error" }); } finally { setBusy(false); } };

  const hospitalAreas = useMemo(
    () => areas.filter((item) => item.hospital_id === hospitalId),
    [areas, hospitalId],
  );
  const visibleArrivals = useMemo(
    () => arrivals.filter((item) => !hospitalId || item.hospital_id === hospitalId),
    [arrivals, hospitalId],
  );

  return <div className="flex min-h-0 flex-1 flex-col gap-3 py-3">
    {error && <Alert variant="destructive"><AlertTitle>Ошибка загрузки</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
    <div className="rounded-xl border bg-card p-3 text-card-foreground">
      <div className="flex flex-wrap items-end gap-3 border-b pb-3">
        {!fixedHospitalId && <div className="grid gap-1.5">
          <Label htmlFor="operations-hospital">Сосудистый центр</Label>
          <Select value={hospitalId || null} onValueChange={(value) => setSelectedHospitalId(value ?? "")}><SelectTrigger id="operations-hospital" className="min-w-72"><SelectValue placeholder="Выберите центр" /></SelectTrigger><SelectContent>{hospitals.map((hospital) => <SelectItem key={hospital.id} value={hospital.id}>{hospital.name}</SelectItem>)}</SelectContent></Select>
        </div>}
        <div className="min-w-0 flex-1 pb-1"><p className="text-sm font-medium">Управление работой центра</p><p className="truncate text-xs text-muted-foreground">{selectedHospital?.address ?? "Ресурсы, сотрудники, зоны и ожидаемые прибытия"}</p></div>
      </div>
      <nav className="mt-2 flex flex-wrap gap-1" aria-label="Разделы работы центра">{([ ["arrivals", "Прибытия", Ambulance], ["resources", "Ресурсы", Wrench], ["staff", "Сотрудники", UsersRound], ["areas", "Зоны", Map] ] as const).filter(([id]) => availableSections.includes(id)).map(([id, label, Icon]) => <Button key={id} size="sm" variant={activeSection === id ? "default" : "ghost"} onClick={() => setSection(id)}><Icon />{label}</Button>)}</nav>
    </div>
    <ScrollFade
      className="min-h-0 flex-1 [&_.bg-background]:bg-card [&_.bg-background]:text-card-foreground"
      viewportClassName="pb-6"
    >
      {!selectedHospital && !loading ? <Empty text="Создайте или выберите больницу." /> : !activeSection ? <Empty text="Для работы с центром у вашей роли нет дополнительных разрешений." /> : activeSection === "arrivals" ? <HospitalArrivalsPanel hospital={selectedHospital} arrivals={visibleArrivals} />
      : activeSection === "resources" ? <div className="grid gap-4 xl:grid-cols-2"><ResourceTable title="Оборудование" items={equipment} names={equipmentNames} busy={busy} canManage={canManageResources} canChangeStatus={canChangeResourceStatus} onAdd={() => openResource("equipment")} onStatus={(id, status) => void changeStatus("equipment", id, status)} onRemove={(id) => void removeResource("equipment", id)} /><ResourceTable title="Операционные" items={rooms} names={operatingNames} busy={busy} canManage={canManageResources} canChangeStatus={canChangeResourceStatus} onAdd={() => openResource("operating")} onStatus={(id, status) => void changeStatus("operating", id, status)} onRemove={(id) => void removeResource("operating", id)} /></div>
      : activeSection === "staff" ? <section className="rounded-xl border bg-background"><header className="flex flex-wrap items-center gap-2 border-b p-4"><div className="mr-auto"><h2 className="font-semibold">Назначенные сотрудники</h2><p className="text-sm text-muted-foreground">Сотрудник может быть назначен в несколько больниц</p></div>{canReadUsers && <StaffUserSelect users={users} assignedIds={staffIds} value={staffUserId} onValueChange={setStaffUserId} disabled={busy} />}{canReadUsers && <Button size="sm" onClick={() => void assignStaff()} disabled={!staffUserId || busy}><Plus />Назначить</Button>}</header>{staffIds.length ? <Table><TableBody>{staffIds.map((id) => <TableRow key={id}><TableCell className="font-medium">{userNames[id] ?? id}</TableCell><TableCell className="w-16"><Button size="icon-sm" variant="ghost" aria-label={`Удалить назначение ${userNames[id] ?? id}`} onClick={() => void revokeStaff(id)} disabled={busy}><Trash2 /></Button></TableCell></TableRow>)}</TableBody></Table> : <Empty text="Сотрудники не назначены." />}</section>
      : <ServiceAreasPanel areas={hospitalAreas} hospital={selectedHospital} busy={busy} onCreate={() => openArea("new")} onEdit={openArea} onRemove={(area) => void removeArea(area)} />}
    </ScrollFade>

    <Dialog open={resourceTarget !== null} onOpenChange={(open) => { if (!open && !busy) setResourceTarget(null); }}><DialogContent><form className="contents" onSubmit={saveResource}><DialogHeader><DialogTitle>Добавить физический ресурс</DialogTitle><DialogDescription>{selectedHospital?.name}</DialogDescription></DialogHeader><div className="grid gap-4"><div className="grid gap-2"><Label>Тип</Label><Select value={resourceTypeId || null} onValueChange={(value) => setResourceTypeId(value ?? "")}><SelectTrigger className="w-full"><SelectValue placeholder="Выберите тип" /></SelectTrigger><SelectContent>{(resourceTarget?.kind === "equipment" ? equipmentTypes : operatingTypes).map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-2"><Label htmlFor="resource-label">Метка</Label><Input id="resource-label" value={resourceLabel} onChange={(event) => setResourceLabel(event.target.value)} placeholder="Например, КТ-01" required /></div></div><DialogFooter><Button type="button" variant="outline" onClick={() => setResourceTarget(null)}>Отмена</Button><Button type="submit" disabled={busy || !resourceTypeId || !resourceLabel.trim()}>Добавить</Button></DialogFooter></form></DialogContent></Dialog>
    {areaTarget && (
      <ServiceAreaDialog
        key={areaTarget === "new" ? "new" : areaTarget.id}
        open={areaDialogOpen}
        target={areaTarget}
        hospital={selectedHospital}
        busy={busy}
        onOpenChange={setAreaDialogOpen}
        onOpenChangeComplete={(open) => {
          if (!open) setAreaTarget(null);
        }}
        onSave={saveArea}
      />
    )}
  </div>;
}

function StaffUserSelect({
  users,
  assignedIds,
  value,
  onValueChange,
  disabled,
}: {
  users: User[];
  assignedIds: string[];
  value: string;
  onValueChange: (value: string) => void;
  disabled: boolean;
}) {
  const [query, setQuery] = useState("");
  const availableUsers = useMemo(
    () => users.filter((user) => !assignedIds.includes(user.id)),
    [assignedIds, users],
  );
  const normalizedQuery = query.trim().toLocaleLowerCase("ru");
  const filteredUsers = availableUsers.filter((user) =>
    `${getUserLabel(user)} ${user.user_name}`
      .toLocaleLowerCase("ru")
      .includes(normalizedQuery),
  );
  const items = useMemo(
    () =>
      availableUsers.map((user) => ({
        value: user.id,
        label: getUserLabel(user),
      })),
    [availableUsers],
  );

  return (
    <Select
      items={items}
      value={value || null}
      onValueChange={(nextValue) => onValueChange(nextValue ?? "")}
      onOpenChange={(open) => {
        if (!open) setQuery("");
      }}
      disabled={disabled || availableUsers.length === 0}
    >
      <SelectTrigger className="w-72">
        <SelectValue placeholder="Выберите сотрудника" />
      </SelectTrigger>
      <SelectContent align="end" className="w-72">
        <div
          className="sticky top-0 z-10 border-b bg-popover p-2"
          onKeyDown={(event) => {
            if (event.key !== "Escape") event.stopPropagation();
          }}
        >
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Поиск по имени или имени пользователя"
              className="h-8 pl-8 shadow-none"
              aria-label="Поиск сотрудника"
            />
          </div>
        </div>
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {getUserLabel(user)}
            </SelectItem>
          ))
        ) : (
          <p className="px-3 py-5 text-center text-xs text-muted-foreground">
            Сотрудники не найдены
          </p>
        )}
      </SelectContent>
    </Select>
  );
}

function ResourceTable({ title, items, names, busy, canManage, canChangeStatus, onAdd, onStatus, onRemove }: { title: string; items: Array<HospitalEquipment | HospitalOperatingRoom>; names: Record<string, string>; busy: boolean; canManage: boolean; canChangeStatus: boolean; onAdd: () => void; onStatus: (id: string, status: HospitalResourceStatus) => void; onRemove: (id: string) => void }) {
  return <section className="rounded-xl border bg-background"><header className="flex items-center justify-between border-b p-4"><h2 className="font-semibold">{title}</h2>{canManage && <Button size="sm" onClick={onAdd}><Plus />Добавить</Button>}</header>{items.length ? <Table><TableHeader><TableRow><TableHead>Метка</TableHead><TableHead>Тип</TableHead><TableHead>Статус</TableHead>{canManage && <TableHead className="w-12" />}</TableRow></TableHeader><TableBody>{items.map((item) => { const typeId = "equipment_id" in item ? item.equipment_id : item.operating_id; return <TableRow key={item.id}><TableCell className="font-medium">{item.label}</TableCell><TableCell>{names[typeId] ?? ("equipment_name" in item ? item.equipment_name : item.operating_name)}</TableCell><TableCell>{canChangeStatus ? <Select value={item.status} onValueChange={(value) => onStatus(item.id, value as HospitalResourceStatus)} disabled={busy}><SelectTrigger size="sm"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(resourceStatusNames).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select> : resourceStatusNames[item.status]}</TableCell>{canManage && <TableCell><Button size="icon-sm" variant="ghost" onClick={() => onRemove(item.id)} disabled={busy}><Trash2 /></Button></TableCell>}</TableRow>; })}</TableBody></Table> : <Empty text="Ресурсы не добавлены." />}</section>;
}
function Empty({ text }: { text: string }) { return <p className="m-4 rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">{text}</p>; }
