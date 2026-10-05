"use client";

import { useCallback, useEffect, useState } from "react";
import { Ambulance, Copy, KeyRound, LoaderCircle, Plus, PowerOff, RefreshCw, Tablet, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { QrCode } from "@/components/ui/qr-code";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ambulanceVehicleApi } from "@/entities/ambulance-vehicle/api/ambulance-vehicle.api";
import type { AmbulanceVehicle, AmbulanceVehicleStatus } from "@/entities/ambulance-vehicle/model/types";
import { deviceApi } from "@/entities/device/api/device.api";
import type { Device, DeviceCredentials } from "@/entities/device/model/types";
import { useAlert } from "@/features/alert/alert-store";
import { usePermissions } from "@/features/auth/use-permissions";
import { useUnsavedChanges, useUnsavedNavigation } from "@/features/unsaved-changes/unsaved-changes-provider";
import { ApiError } from "@/shared/api/types";

const statusNames: Record<AmbulanceVehicleStatus, string> = {
  active: "Активна",
  inactive: "Неактивна",
  maintenance: "На обслуживании",
};

type FleetView = "vehicles" | "devices";

function errorMessage(error: unknown) {
  if (ApiError.isApiError(error)) return error.getMessage();
  return error instanceof Error ? error.message : "Неизвестная ошибка";
}

export function FleetManagement() {
  const showAlert = useAlert();
  const { can, canAny } = usePermissions();
  const { requestNavigation } = useUnsavedNavigation();
  const [vehicles, setVehicles] = useState<AmbulanceVehicle[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vehicleTarget, setVehicleTarget] = useState<AmbulanceVehicle | "new" | null>(null);
  const [carNumber, setCarNumber] = useState("");
  const [vehicleStatus, setVehicleStatus] = useState<AmbulanceVehicleStatus>("active");
  const [credentials, setCredentials] = useState<DeviceCredentials | null>(null);
  const [credentialsOpen, setCredentialsOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<Device | null>(null);
  const [disableTarget, setDisableTarget] = useState<Device | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Device | null>(null);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<FleetView>("vehicles");
  const canManageVehicles = can("ambulance_vehicle.manage");
  const canReadDevices = can("device.read");
  const canProvisionDevices = can("device.provision");
  const canResetDeviceSecret = can("device.reset_secret");
  const canChangeDeviceStatus = can("device.change_status");
  const canDeleteDevice = can("device.delete");
  const canUseDeviceSection = canAny([
    "device.read",
    "device.provision",
  ]);
  const visibleView: FleetView = view === "vehicles" && !canManageVehicles
    ? "devices"
    : view === "devices" && !canUseDeviceSection
      ? "vehicles"
      : view;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [nextVehicles, nextDevices] = await Promise.all([
        canManageVehicles ? ambulanceVehicleApi.list() : Promise.resolve(null),
        canReadDevices ? deviceApi.list() : Promise.resolve(null),
      ]);
      if (nextVehicles) setVehicles(nextVehicles);
      if (nextDevices) setDevices(nextDevices);
      setError(null);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [canManageVehicles, canReadDevices]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const openVehicle = (target: AmbulanceVehicle | "new") => {
    setVehicleTarget(target);
    setCarNumber(target === "new" ? "" : target.car_number);
    setVehicleStatus(target === "new" ? "active" : target.status);
  };

  const vehicleHasChanges = Boolean(
    vehicleTarget &&
    (vehicleTarget === "new"
      ? carNumber.trim()
      : carNumber !== vehicleTarget.car_number || vehicleStatus !== vehicleTarget.status),
  );

  const saveVehicle = async (): Promise<boolean> => {
    if (!vehicleTarget || !carNumber.trim()) return false;
    setBusy(true);
    try {
      const saved = vehicleTarget === "new"
        ? await ambulanceVehicleApi.create({ car_number: carNumber.trim() })
        : await ambulanceVehicleApi.update(vehicleTarget.id, {
            car_number: carNumber.trim(),
            status: vehicleStatus,
          });
      setVehicles((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
      setVehicleTarget(null);
      showAlert({ title: "Машина сохранена", type: "success" });
      return true;
    } catch (cause) {
      showAlert({ title: "Не удалось сохранить машину", description: errorMessage(cause), type: "error" });
      return false;
    } finally {
      setBusy(false);
    }
  };

  useUnsavedChanges({
    active: vehicleHasChanges,
    onSave: saveVehicle,
    onDiscard: () => setVehicleTarget(null),
  });

  const closeVehicle = () => {
    if (busy) return;
    if (vehicleHasChanges) requestNavigation(() => setVehicleTarget(null));
    else setVehicleTarget(null);
  };

  const provision = async () => {
    setBusy(true);
    try {
      const created = await deviceApi.create();
      setCredentials(created);
      setCredentialsOpen(true);
      setDevices((current) => [created.device, ...current]);
      showAlert({ title: "Планшет зарегистрирован", description: "Сохраните данные или отсканируйте QR-код до закрытия окна.", type: "success" });
    } catch (cause) {
      showAlert({ title: "Не удалось зарегистрировать планшет", description: errorMessage(cause), type: "error" });
    } finally {
      setBusy(false);
    }
  };

  const resetSecret = async (device: Device) => {
    setBusy(true);
    try {
      const rotated = await deviceApi.resetAuthSecret(device.device_id);
      setCredentials(rotated);
      setCredentialsOpen(true);
      setResetTarget(null);
      setDevices((current) => current.map((item) => item.id === rotated.device.id ? rotated.device : item));
      showAlert({ title: "Секрет планшета заменён", description: "Передайте новые данные на планшет.", type: "success" });
    } catch (cause) {
      showAlert({ title: "Не удалось заменить секрет", description: errorMessage(cause), type: "error" });
    } finally {
      setBusy(false);
    }
  };

  const disableDevice = async (device: Device) => {
    setBusy(true);
    try {
      const updated = await deviceApi.disable(device.device_id);
      setDevices((current) => current.map((item) => item.id === updated.id ? updated : item));
      setDisableTarget(null);
      showAlert({ title: "Планшет отключён", description: "Активная смена устройства отозвана.", type: "success" });
    } catch (cause) {
      showAlert({ title: "Не удалось отключить планшет", description: errorMessage(cause), type: "error" });
    } finally {
      setBusy(false);
    }
  };

  const deleteDevice = async (device: Device) => {
    setBusy(true);
    try {
      await deviceApi.delete(device.device_id);
      setDevices((current) => current.filter((item) => item.id !== device.id));
      setDeleteTarget(null);
      showAlert({ title: "Планшет удалён", type: "success" });
    } catch (cause) {
      showAlert({ title: "Не удалось удалить планшет", description: errorMessage(cause), type: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 py-3 pb-6">
      <div className="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-xl border bg-card px-4 py-3 text-card-foreground">
        {canManageVehicles && <SummaryStat value={loading ? null : `${vehicles.filter((item) => item.status === "active").length} / ${vehicles.length}`} label="Активные машины" />}
        {canManageVehicles && <SummaryStat value={loading ? null : String(vehicles.filter((item) => item.status === "maintenance").length)} label="На обслуживании" tone="warning" />}
        {canReadDevices && <SummaryStat value={loading ? null : `${devices.filter((item) => item.status === "active").length} / ${devices.length}`} label="Активные планшеты" />}
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-2 text-card-foreground">
        {canManageVehicles && <Button type="button" size="sm" variant={visibleView === "vehicles" ? "default" : "ghost"} onClick={() => setView("vehicles")}><Ambulance />Машины</Button>}
        {canUseDeviceSection && <Button type="button" size="sm" variant={visibleView === "devices" ? "default" : "ghost"} onClick={() => setView("devices")}><Tablet />Планшеты</Button>}
        <Button className="ml-auto" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={loading ? "animate-spin" : ""} /> Обновить
        </Button>
      </div>
      {error && <Alert variant="destructive" className="mb-3"><AlertTitle>Не удалось загрузить парк</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {visibleView === "vehicles" ? <section className="overflow-hidden rounded-xl border bg-card text-card-foreground">
          <header className="flex items-center justify-between gap-3 border-b p-4">
            <div><h2 className="font-semibold">Машины скорой</h2><p className="text-sm text-muted-foreground">Добавьте машину и оставьте статус «Активна», чтобы планшет мог открыть на ней смену.</p></div>
            {canManageVehicles && <Button size="sm" onClick={() => openVehicle("new")}><Plus /> Добавить машину</Button>}
          </header>
          <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Номер</TableHead><TableHead>Статус</TableHead><TableHead className="w-24" /></TableRow></TableHeader>
            <TableBody>{vehicles.map((vehicle) => <TableRow key={vehicle.id}><TableCell className="font-medium"><span className="inline-flex items-center gap-2"><Ambulance className="size-4 text-muted-foreground" />{vehicle.car_number}</span></TableCell><TableCell><VehicleStatus status={vehicle.status} /></TableCell><TableCell><Button variant="ghost" size="sm" onClick={() => openVehicle(vehicle)}>Изменить</Button></TableCell></TableRow>)}</TableBody>
          </Table>
          </div>
          {!loading && vehicles.length === 0 && <EmptyFleet icon={Ambulance} title="Машин пока нет" description="Добавьте первую машину, чтобы бригада могла выбрать её при начале смены." action="Добавить машину" onAction={() => openVehicle("new")} />}
        </section>
        : <section className="overflow-hidden rounded-xl border bg-card text-card-foreground">
          <header className="flex items-center justify-between gap-3 border-b p-4">
            <div><h2 className="font-semibold">Планшеты</h2><p className="text-sm text-muted-foreground">Зарегистрируйте устройство и сразу сохраните одноразовый секрет на планшете.</p></div>
            {canProvisionDevices && <Button size="sm" onClick={() => void provision()} disabled={busy}><Plus /> Зарегистрировать планшет</Button>}
          </header>
          <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Идентификатор устройства</TableHead><TableHead>Статус</TableHead><TableHead>Последняя связь</TableHead><TableHead className="w-72" /></TableRow></TableHeader>
            <TableBody>{devices.map((device) => <TableRow key={device.id}><TableCell className="max-w-64 truncate font-mono text-xs"><span className="inline-flex items-center gap-2"><Tablet className="size-4 text-muted-foreground" />{device.device_id}</span></TableCell><TableCell>{device.status === "active" ? "Активен" : "Отключён"}</TableCell><TableCell className="text-muted-foreground">{device.last_seen_at ? formatDate(device.last_seen_at) : "Нет данных"}</TableCell><TableCell><div className="flex justify-end gap-1">{canResetDeviceSecret && <Button variant="ghost" size="sm" onClick={() => setResetTarget(device)} disabled={busy || device.status !== "active"}><KeyRound /> Заменить секрет</Button>}{canChangeDeviceStatus && device.status === "active" && <Button variant="ghost" size="icon-sm" aria-label="Отключить планшет" onClick={() => setDisableTarget(device)} disabled={busy}><PowerOff /></Button>}{canDeleteDevice && <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" aria-label="Удалить планшет" onClick={() => setDeleteTarget(device)} disabled={busy}><Trash2 /></Button>}</div></TableCell></TableRow>)}</TableBody>
          </Table>
          </div>
          {!loading && canReadDevices && devices.length === 0 && <EmptyFleet icon={Tablet} title="Планшетов пока нет" description="Зарегистрируйте планшет и передайте выданные данные на устройство." action={canProvisionDevices ? "Зарегистрировать планшет" : undefined} onAction={canProvisionDevices ? () => void provision() : undefined} />}
          {!canReadDevices && <div className="p-8 text-center text-sm text-muted-foreground">Просмотр списка планшетов недоступен для вашей роли.</div>}
        </section>
        }
      </div>

      <Dialog open={vehicleTarget !== null} onOpenChange={(open) => { if (!open) closeVehicle(); }}>
        <DialogContent><form className="contents" onSubmit={(event) => { event.preventDefault(); void saveVehicle(); }}><DialogHeader><DialogTitle>{vehicleTarget === "new" ? "Новая машина" : "Изменить машину"}</DialogTitle><DialogDescription>Номер используется бригадой при открытии смены.</DialogDescription></DialogHeader>
          <div className="grid gap-4"><div className="grid gap-2"><Label htmlFor="car-number">Номер машины</Label><Input id="car-number" value={carNumber} onChange={(event) => setCarNumber(event.target.value)} required autoFocus /></div>
            {vehicleTarget !== "new" && <div className="grid gap-2"><Label htmlFor="vehicle-status">Статус</Label><Select value={vehicleStatus} onValueChange={(value) => setVehicleStatus(value as AmbulanceVehicleStatus)}><SelectTrigger id="vehicle-status" className="w-full"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(statusNames).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>}
          </div><DialogFooter><Button type="button" variant="outline" onClick={closeVehicle} disabled={busy}>Отмена</Button>{vehicleHasChanges && <Button type="submit" disabled={busy || !carNumber.trim()}>{busy && <LoaderCircle className="animate-spin" />}{vehicleTarget === "new" ? "Добавить" : "Сохранить"}</Button>}</DialogFooter></form></DialogContent>
      </Dialog>

      <Dialog open={credentialsOpen} onOpenChange={setCredentialsOpen} onOpenChangeComplete={(open) => { if (!open) setCredentials(null); }}>
        <DialogContent className="sm:max-w-4xl"><DialogHeader><DialogTitle>Данные планшета</DialogTitle><DialogDescription>Секрет и QR-код отображаются один раз. Отсканируйте код на планшете или введите данные вручную.</DialogDescription></DialogHeader>
          {credentials && <div className="grid gap-4 sm:grid-cols-[minmax(0,320px)_minmax(0,1fr)]"><QrCode value={credentials.qr_payload} label="QR-код с данными планшета" /><div className="grid content-center gap-3"><Credential label="Идентификатор устройства" value={credentials.device.device_id} /><Credential label="Секрет авторизации" value={credentials.auth_secret} /><p className="text-xs leading-relaxed text-muted-foreground">QR-код содержит только идентификатор и одноразово выданный секрет. После закрытия окна он не сохраняется.</p></div></div>}
          <DialogFooter><Button onClick={() => setCredentialsOpen(false)}>Готово</Button></DialogFooter></DialogContent>
      </Dialog>
      <Dialog open={resetTarget !== null} onOpenChange={(open) => { if (!open && !busy) setResetTarget(null); }}><DialogContent><DialogHeader><DialogTitle>Заменить секрет планшета?</DialogTitle><DialogDescription>Активные смены устройства будут отозваны. Старый секрет перестанет работать.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setResetTarget(null)} disabled={busy}>Отмена</Button><Button variant="destructive" onClick={() => { if (resetTarget) void resetSecret(resetTarget); }} disabled={busy}>{busy && <LoaderCircle className="animate-spin" />}Заменить секрет</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={disableTarget !== null} onOpenChange={(open) => { if (!open && !busy) setDisableTarget(null); }}><DialogContent><DialogHeader><DialogTitle>Отключить планшет?</DialogTitle><DialogDescription>Текущая смена будет отозвана, а планшет больше не сможет войти. Включить его обратно этой операцией нельзя.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDisableTarget(null)} disabled={busy}>Отмена</Button><Button variant="destructive" onClick={() => { if (disableTarget) void disableDevice(disableTarget); }} disabled={busy}>{busy && <LoaderCircle className="animate-spin" />}Отключить</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open && !busy) setDeleteTarget(null); }}><DialogContent><DialogHeader><DialogTitle>Удалить планшет?</DialogTitle><DialogDescription>Устройство исчезнет из списка, а его активная смена будет отозвана. Это действие нельзя отменить.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={busy}>Отмена</Button><Button variant="destructive" onClick={() => { if (deleteTarget) void deleteDevice(deleteTarget); }} disabled={busy}>{busy && <LoaderCircle className="animate-spin" />}Удалить</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}

function SummaryStat({ value, label, tone = "primary" }: { value: string | null; label: string; tone?: "primary" | "warning" }) {
  return <div className="flex items-center gap-2.5"><span className={tone === "warning" ? "size-2 rounded-full bg-amber-500" : "size-2 rounded-full bg-primary"} />{value === null ? <LoaderCircle className="size-4 animate-spin text-muted-foreground" /> : <span className="text-sm font-semibold tabular-nums">{value}</span>}<span className="text-sm text-muted-foreground">{label}</span></div>;
}

function VehicleStatus({ status }: { status: AmbulanceVehicleStatus }) {
  const className = status === "active" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : status === "maintenance" ? "bg-amber-500/10 text-amber-700 dark:text-amber-400" : "bg-muted text-muted-foreground";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>{statusNames[status]}</span>;
}

function EmptyFleet({ icon: Icon, title, description, action, onAction }: { icon: typeof Ambulance; title: string; description: string; action?: string; onAction?: () => void }) {
  return <div className="m-4 flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center"><Icon className="mb-3 size-7 text-muted-foreground" /><p className="font-medium">{title}</p><p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>{action && onAction && <Button className="mt-4" size="sm" onClick={onAction}><Plus />{action}</Button>}</div>;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function Credential({ label, value }: { label: string; value: string }) {
  const showAlert = useAlert();
  return <div className="grid gap-1.5"><Label>{label}</Label><div className="flex gap-2"><Input value={value} readOnly className="font-mono text-xs" /><Button type="button" variant="outline" size="icon" aria-label={`Скопировать ${label}`} onClick={() => { void navigator.clipboard.writeText(value); showAlert({ title: "Скопировано", type: "success" }); }}><Copy /></Button></div></div>;
}
