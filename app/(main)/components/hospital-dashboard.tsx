"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, Building2, LoaderCircle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { hospitalArrivalApi } from "@/entities/hospital-arrival/api/hospital-arrival.api";
import type { HospitalArrival } from "@/entities/hospital-arrival/model/types";
import { hospitalEquipmentApi } from "@/entities/hospital-equipment/api/hospital-equipment.api";
import type { HospitalEquipment } from "@/entities/hospital-equipment/model/types";
import { hospitalOperatingRoomApi } from "@/entities/hospital-operating-room/api/hospital-operating-room.api";
import type { HospitalOperatingRoom } from "@/entities/hospital-operating-room/model/types";
import { hospitalApi } from "@/entities/hospital/api/hospital.api";
import type { Hospital } from "@/entities/hospital/model/types";
import { usePermissions } from "@/features/auth/use-permissions";
import { ApiError } from "@/shared/api/types";
import { HospitalOverviewPanel, type OverviewSection } from "../operations/components/hospital-overview-panel";

function errorMessage(error: unknown): string {
  if (ApiError.isApiError(error)) return error.getMessage();
  return error instanceof Error ? error.message : "Неизвестная ошибка";
}

export function HospitalDashboard({ hospitalIds }: { hospitalIds: string[] }) {
  const router = useRouter();
  const { can, canAny } = usePermissions();
  const [selectedHospitalId, setSelectedHospitalId] = useState(hospitalIds[0] ?? "");
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [arrivals, setArrivals] = useState<HospitalArrival[]>([]);
  const [equipment, setEquipment] = useState<HospitalEquipment[]>([]);
  const [rooms, setRooms] = useState<HospitalOperatingRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const canReadHospitals = can("hospital.read");
  const canReadArrivals = can("hospital_arrival.read");
  const canReadResources = can("hospital_resource.read");
  const canManageSchedule = canAny(["hospital_resource.change_status", "hospital_resource.manage"]);

  const assignedHospitals = useMemo(
    () => hospitals.filter((hospital) => hospitalIds.includes(hospital.id)),
    [hospitalIds, hospitals],
  );
  const visibleArrivals = useMemo(
    () => arrivals.filter((arrival) => arrival.hospital_id === selectedHospitalId),
    [arrivals, selectedHospitalId],
  );
  const selectedHospital = assignedHospitals.find((hospital) => hospital.id === selectedHospitalId);
  const selectedHospitalName = selectedHospital?.name
    ?? visibleArrivals[0]?.hospital_name
    ?? (hospitalIds.length > 1 ? "Назначенный центр" : "Мой сосудистый центр");

  const load = useCallback(async (silent = false) => {
    if (!selectedHospitalId) return;
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const [nextHospitals, nextArrivals, nextEquipment, nextRooms] = await Promise.all([
        canReadHospitals ? hospitalApi.list() : Promise.resolve([]),
        canReadArrivals ? hospitalArrivalApi.list() : Promise.resolve([]),
        canReadResources ? hospitalEquipmentApi.list(selectedHospitalId) : Promise.resolve([]),
        canReadResources ? hospitalOperatingRoomApi.list(selectedHospitalId) : Promise.resolve([]),
      ]);
      setHospitals(nextHospitals);
      setArrivals(nextArrivals);
      setEquipment(nextEquipment);
      setRooms(nextRooms);
      setUpdatedAt(new Date());
      setError(null);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [canReadArrivals, canReadHospitals, canReadResources, selectedHospitalId]);

  const refreshArrivals = useCallback(async () => {
    if (!canReadArrivals) return;
    try {
      setArrivals(await hospitalArrivalApi.list());
      setUpdatedAt(new Date());
      setError(null);
    } catch (cause) {
      setError(errorMessage(cause));
    }
  }, [canReadArrivals]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    if (!canReadArrivals) return;
    const interval = window.setInterval(() => void refreshArrivals(), 15_000);
    return () => window.clearInterval(interval);
  }, [canReadArrivals, refreshArrivals]);

  const openSection = (section: OverviewSection) => {
    router.push(`/hospitals/${selectedHospitalId}?section=${section}`);
  };

  if (!selectedHospitalId) {
    return <div className="flex min-h-0 flex-1 items-center justify-center rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">Пользователь пока не назначен ни в один сосудистый центр.</div>;
  }

  return (
    <main className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
      <header className="flex shrink-0 items-center gap-3 rounded-xl border bg-card px-4 py-3 text-card-foreground">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><Building2 className="size-4" /></span>
        <div className="min-w-0 flex-1">
          {hospitalIds.length > 1 ? (
            <Select value={selectedHospitalId} onValueChange={(value) => setSelectedHospitalId(value ?? hospitalIds[0] ?? "")}>
              <SelectTrigger className="h-8 w-full max-w-sm border-0 bg-transparent px-0 text-base font-semibold shadow-none"><SelectValue /></SelectTrigger>
              <SelectContent>{hospitalIds.map((id, index) => <SelectItem key={id} value={id}>{assignedHospitals.find((hospital) => hospital.id === id)?.name ?? `Назначенный центр ${index + 1}`}</SelectItem>)}</SelectContent>
            </Select>
          ) : <h1 className="truncate font-semibold">{selectedHospitalName}</h1>}
          <p className="truncate text-xs text-muted-foreground">{updatedAt ? `Данные обновлены в ${updatedAt.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}` : "Оперативная готовность центра"}</p>
        </div>
        <Button size="icon-sm" variant="ghost" onClick={() => void load(true)} disabled={refreshing} aria-label="Обновить данные"><RefreshCw className={refreshing ? "animate-spin" : ""} /></Button>
        {canReadHospitals && <Button nativeButton={false} render={<Link href={`/hospitals/${selectedHospitalId}`} />} size="sm" variant="outline">Управление центром<ArrowRight /></Button>}
      </header>

      {error && <Alert variant="destructive" className="shrink-0"><AlertTitle>Не удалось обновить оперативные данные</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      {loading ? <div className="flex min-h-0 flex-1 items-center justify-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" />Загружаем состояние центра…</div>
        : <HospitalOverviewPanel hospitalName={selectedHospitalName} arrivals={visibleArrivals} rooms={rooms} equipment={equipment} canReadArrivals={canReadArrivals} canReadResources={canReadResources} canManageSchedule={canManageSchedule} onOpenSection={openSection} />}
    </main>
  );
}
