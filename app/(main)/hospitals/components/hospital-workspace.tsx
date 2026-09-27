"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Building2, LoaderCircle, MapPin, Pencil, Phone, Stethoscope, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { HospitalOperations } from "../../operations/components/hospital-operations";
import { HospitalForm } from "./hospital-form";
import { getHospitalsErrorMessage, useHospitals } from "../hooks/use-hospitals";
import { useAlert } from "@/features/alert/alert-store";

export function HospitalWorkspace({ hospitalId }: { hospitalId: string }) {
  const router = useRouter();
  const showAlert = useAlert();
  const {
    hospitals,
    facilityTypes,
    sicknesses,
    hospitalSicknesses,
    isLoading,
    error,
    loadHospitalSicknesses,
    createHospital,
    updateHospital,
    removeHospital,
  } = useHospitals();
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const hospital = hospitals.find((item) => item.id === hospitalId) ?? null;
  const facilityType = facilityTypes.find((item) => item.id === hospital?.facility_type_id);
  const linkedSicknesses = hospitalSicknesses[hospitalId] ?? [];

  useEffect(() => {
    if (!hospital) return;
    const timer = window.setTimeout(() => {
      void loadHospitalSicknesses(hospital.id).catch(() => undefined);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [hospital, loadHospitalSicknesses]);

  const remove = async () => {
    if (!hospital) return;
    setDeleting(true);
    try {
      await removeHospital(hospital.id);
      showAlert({ title: "Сосудистый центр удалён", type: "success" });
      router.push("/hospitals");
    } catch (cause) {
      showAlert({ title: "Не удалось удалить центр", description: getHospitalsErrorMessage(cause), type: "error" });
    } finally {
      setDeleting(false);
    }
  };

  if (isLoading) {
    return <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" />Загружаем центр…</div>;
  }

  if (error || !hospital) {
    return <div className="flex h-full flex-col"><div className="flex h-12 items-center"><Button nativeButton={false} render={<Link href="/hospitals" />} variant="ghost" size="sm"><ArrowLeft />К списку центров</Button></div><Alert variant="destructive" className="mt-3"><AlertTitle>Центр недоступен</AlertTitle><AlertDescription>{error ?? "Сосудистый центр не найден."}</AlertDescription></Alert></div>;
  }

  const hasCoordinates = Boolean(hospital.latitude || hospital.longitude);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex h-12 shrink-0 items-center gap-3 pr-28">
        <Button nativeButton={false} render={<Link href="/hospitals" />} variant="ghost" size="icon-sm" aria-label="К списку центров"><ArrowLeft /></Button>
        <h1 className="min-w-0 truncate text-2xl font-semibold tracking-tight">{hospital.name}</h1>
        <span className="hidden rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary sm:inline">{facilityType?.name ?? "Тип не указан"}</span>
        <div className="ml-auto flex items-center gap-1">
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}><Pencil />Изменить</Button>
          <Button size="icon-sm" variant="ghost" aria-label="Удалить центр" onClick={() => setDeleteOpen(true)}><Trash2 /></Button>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto pb-6 pt-3">
        <section className="rounded-xl border bg-card p-4 text-card-foreground">
          {hospital.description && <p className="mb-4 text-sm text-muted-foreground">{hospital.description}</p>}
          <div className="grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
            <Info icon={MapPin} label="Адрес" value={hospital.address || "Не указан"} />
            <Info icon={Phone} label="Телефон" value={hospital.phone || "Не указан"} />
            <Info icon={Building2} label="Координаты" value={hasCoordinates ? `${hospital.latitude.toFixed(5)}, ${hospital.longitude.toFixed(5)}` : "Не указаны"} />
            <Info icon={Stethoscope} label="Направления" value={linkedSicknesses.length ? linkedSicknesses.map((item) => item.name).join(", ") : "Не назначены"} />
          </div>
        </section>

        <HospitalOperations fixedHospitalId={hospital.id} />
      </main>

      <HospitalForm
        target={editing ? hospital : null}
        facilityTypes={facilityTypes}
        sicknesses={sicknesses}
        onOpenChange={setEditing}
        onLoadSicknesses={loadHospitalSicknesses}
        onCreate={createHospital}
        onUpdate={updateHospital}
      />

      <Dialog open={deleteOpen} onOpenChange={(open) => { if (!deleting) setDeleteOpen(open); }}>
        <DialogContent><DialogHeader><DialogTitle>Удалить сосудистый центр?</DialogTitle><DialogDescription>«{hospital.name}» и все связанные настройки будут удалены. Действие нельзя отменить.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>Отмена</Button><Button variant="destructive" onClick={() => void remove()} disabled={deleting}>{deleting && <LoaderCircle className="animate-spin" />}Удалить</Button></DialogFooter></DialogContent>
      </Dialog>
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return <div className="flex min-w-0 items-start gap-2"><Icon className="mt-0.5 size-4 shrink-0 text-primary" /><div className="min-w-0"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-0.5 truncate font-medium" title={value}>{value}</p></div></div>;
}
