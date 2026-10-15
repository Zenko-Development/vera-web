"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Building2, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { emergencyDestinationApi } from "@/entities/emergency-destination/api/emergency-destination.api";
import type { EmergencyDestination, EmergencyDestinationCandidate } from "@/entities/emergency-destination/model/types";
import type { FleetLiveVehicle } from "@/entities/fleet-live/model/types";
import { useAlert } from "@/features/alert/alert-store";
import { ApiError } from "@/shared/api/types";

type PendingDestination = {
  callId: string;
  carNumber: string;
  destination: EmergencyDestination;
};

const roomStatusNames: Record<string, string> = {
  ready: "Готова",
  occupied: "Занята",
  maintenance: "На обслуживании",
};

function message(error: unknown): string {
  if (ApiError.isApiError(error)) return error.getMessage();
  return error instanceof Error ? error.message : "Неизвестная ошибка";
}

export function DispatcherDestinations({ vehicles, canSelect }: { vehicles: FleetLiveVehicle[]; canSelect: boolean }) {
  const showAlert = useAlert();
  const [items, setItems] = useState<PendingDestination[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<PendingDestination | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const callVehicles = useMemo(
    () => vehicles.filter((vehicle): vehicle is FleetLiveVehicle & { emergency_call_id: string } => Boolean(vehicle.emergency_call_id)),
    [vehicles],
  );
  const callKey = callVehicles.map((vehicle) => vehicle.emergency_call_id).sort().join(",");
  const visibleItems = callKey ? items : [];

  useEffect(() => {
    if (!callKey) return;
    let active = true;
    Promise.resolve()
      .then(() => {
        if (active) setLoading(true);
        return Promise.allSettled(callVehicles.map(async (vehicle) => ({
          callId: vehicle.emergency_call_id,
          carNumber: vehicle.car_number,
          destination: await emergencyDestinationApi.getForDispatcher(vehicle.emergency_call_id),
        })));
      })
      .then((results) => {
        if (!active) return;
        setItems(results.flatMap((result) => result.status === "fulfilled" && result.value.destination.status === "no_candidates" ? [result.value] : []));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [callKey, callVehicles]);

  const choose = async (candidate: EmergencyDestinationCandidate) => {
    if (!selected) return;
    setBusy(true);
    try {
      await emergencyDestinationApi.selectForDispatcher(selected.callId, { hospital_id: candidate.hospital_id });
      setItems((current) => current.filter((item) => item.callId !== selected.callId));
      setSelected(null);
      setSelectedCandidateId(null);
      showAlert({ title: "Больница назначена", description: `${selected.carNumber} · ${candidate.name}`, type: "success" });
    } catch (cause) {
      showAlert({ title: "Не удалось назначить больницу", description: message(cause), type: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="border-t pt-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-medium"><AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />Требуют решения</h3>
        <span className="text-xs text-muted-foreground">{visibleItems.length}</span>
      </div>
      {loading ? <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground"><LoaderCircle className="size-3.5 animate-spin" />Проверяем направления…</div>
        : visibleItems.length === 0 ? <p className="py-2 text-xs text-muted-foreground">Вызовов для ручного назначения нет.</p>
        : <div className="space-y-2">{visibleItems.map((item) => <button key={item.callId} type="button" onClick={() => { setSelected(item); setSelectedCandidateId(null); }} className="flex w-full items-center gap-3 rounded-lg border border-amber-500/25 bg-amber-500/5 p-3 text-left transition hover:border-amber-500/45"><span className="flex size-8 items-center justify-center rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400"><Building2 className="size-4" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-medium">{item.carNumber}</span><span className="block truncate text-xs text-muted-foreground">Выбрать больницу из {item.destination.candidates.length} вариантов</span></span></button>)}</div>}

      <Dialog open={selected !== null} onOpenChange={(open) => { if (!open && !busy) { setSelected(null); setSelectedCandidateId(null); } }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>Назначить больницу</DialogTitle><DialogDescription>Машина {selected?.carNumber}. Автоматический выбор невозможен — проверьте состояния операционных и подтвердите решение.</DialogDescription></DialogHeader>
          <div className="grid max-h-[55vh] gap-2 overflow-y-auto">
            {selected?.destination.candidates.map((candidate) => {
              const isSelected = selectedCandidateId === candidate.hospital_id;
              return <article key={candidate.hospital_id} className={isSelected ? "rounded-xl border border-primary bg-primary/[0.04] p-4" : "rounded-xl border p-4"}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="font-medium">{candidate.name}</h3><p className="mt-1 text-sm text-muted-foreground">{candidate.address}</p></div><span className={candidate.operating_available ? "rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400" : "rounded-full bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-700 dark:text-amber-400"}>{candidate.operating_available ? "Есть готовая" : "Нет готовых"}</span></div>{(candidate.operating_rooms ?? []).length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{candidate.operating_rooms.map((room, index) => <span key={room.id ?? `${candidate.hospital_id}-${index}`} className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">{room.label || room.operating_name || `Операционная ${index + 1}`}: {roomStatusNames[room.status] ?? room.status}</span>)}</div>}<Button className="mt-4" size="sm" variant={isSelected ? "default" : "outline"} aria-pressed={isSelected} onClick={() => setSelectedCandidateId(candidate.hospital_id)} disabled={!canSelect || busy}>{isSelected ? "Выбрано" : "Выбрать"}</Button></article>;
            })}
            {selected?.destination.candidates.length === 0 && <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">Сервер не вернул вариантов для ручного выбора.</p>}
          </div>
          {!canSelect && <p className="text-sm text-muted-foreground">Для назначения требуется право на ручной выбор больницы.</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSelected(null); setSelectedCandidateId(null); }} disabled={busy}>Закрыть</Button>
            <Button onClick={() => { const candidate = selected?.destination.candidates.find((item) => item.hospital_id === selectedCandidateId); if (candidate) void choose(candidate); }} disabled={!canSelect || !selectedCandidateId || busy}>
              {busy && <LoaderCircle className="animate-spin" />}Назначить больницу
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
