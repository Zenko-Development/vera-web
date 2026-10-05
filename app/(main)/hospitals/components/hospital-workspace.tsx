"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Info, LoaderCircle, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HospitalOperations } from "../../operations/components/hospital-operations";
import { HospitalForm } from "./hospital-form";
import { getHospitalsErrorMessage, useHospitals } from "../hooks/use-hospitals";
import { useAlert } from "@/features/alert/alert-store";
import { usePermissions } from "@/features/auth/use-permissions";

export function HospitalWorkspace({ hospitalId }: { hospitalId: string }) {
  const router = useRouter();
  const showAlert = useAlert();
  const { can } = usePermissions();
  const canManageHospital = can("hospital.manage");
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
      void loadHospitalSicknesses(hospital.id).catch((cause) => {
        showAlert({
          title: "Не удалось загрузить направления центра",
          description: getHospitalsErrorMessage(cause),
          type: "error",
        });
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [hospital, loadHospitalSicknesses, showAlert]);

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

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex h-9 shrink-0 items-center gap-3 pr-34">
        <Button nativeButton={false} render={<Link href="/hospitals" />} variant="ghost" size="icon-sm" aria-label="К списку центров"><ArrowLeft /></Button>
        <h1 className="min-w-0 truncate text-2xl font-semibold tracking-tight">{hospital.name}</h1>
        <div className="ml-auto flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger
              delay={0}
              render={
                <button
                  type="button"
                  className="flex size-8 items-center justify-center rounded-md border border-input bg-background text-foreground shadow-xs transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Информация о центре"
                />
              }
            >
              <Info className="size-4" />
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              align="end"
              className="block w-80 max-w-[calc(100vw-2rem)] space-y-3 p-4 text-left"
            >
              {hospital.description && (
                <p className="leading-relaxed opacity-80">{hospital.description}</p>
              )}
              <dl className="grid gap-2">
                <HospitalDetail label="Тип" value={facilityType?.name ?? "Не указан"} />
                <HospitalDetail label="Адрес" value={hospital.address || "Не указан"} />
                <HospitalDetail label="Телефон" value={hospital.phone || "Не указан"} />
                <HospitalDetail
                  label="Направления"
                  value={
                    linkedSicknesses.length
                      ? linkedSicknesses.map((item) => item.name).join(", ")
                      : "Не назначены"
                  }
                />
              </dl>
            </TooltipContent>
          </Tooltip>
          {canManageHospital && <Button size="sm" variant="outline" onClick={() => setEditing(true)}><Pencil />Изменить</Button>}
          {canManageHospital && <Button size="icon-sm" variant="ghost" aria-label="Удалить центр" onClick={() => setDeleteOpen(true)}><Trash2 /></Button>}
        </div>
      </header>

      <main className="flex min-h-0 flex-1 overflow-hidden pb-3 pt-3">
        <HospitalOperations fixedHospitalId={hospital.id} />
      </main>

      {canManageHospital && <HospitalForm
        target={editing ? hospital : null}
        facilityTypes={facilityTypes}
        sicknesses={sicknesses}
        onOpenChange={setEditing}
        onLoadSicknesses={loadHospitalSicknesses}
        onCreate={createHospital}
        onUpdate={updateHospital}
      />}

      <Dialog open={deleteOpen} onOpenChange={(open) => { if (!deleting) setDeleteOpen(open); }}>
        <DialogContent><DialogHeader><DialogTitle>Удалить сосудистый центр?</DialogTitle><DialogDescription>«{hospital.name}» и все связанные настройки будут удалены. Действие нельзя отменить.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>Отмена</Button><Button variant="destructive" onClick={() => void remove()} disabled={deleting}>{deleting && <LoaderCircle className="animate-spin" />}Удалить</Button></DialogFooter></DialogContent>
      </Dialog>
    </div>
  );
}

function HospitalDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] opacity-60">{label}</dt>
      <dd className="mt-0.5 leading-snug">{value}</dd>
    </div>
  );
}
