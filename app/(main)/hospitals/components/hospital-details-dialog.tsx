"use client";

import { useState } from "react";
import {
  Building2,
  CalendarClock,
  LoaderCircle,
  MapPin,
  Pencil,
  Phone,
  Stethoscope,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Hospital } from "@/entities/hospital/model/types";
import type { Sickness } from "@/entities/sickness/model/types";
import { useAlert } from "@/features/alert/alert-store";
import { getHospitalsErrorMessage } from "../hooks/use-hospitals";

type Props = {
  hospital: Hospital | null;
  facilityTypeName?: string;
  sicknesses?: Sickness[];
  isLoadingSicknesses: boolean;
  onEdit: (hospital: Hospital) => void;
  onDelete: (id: Hospital["id"]) => Promise<void>;
  onOpenChange: (open: boolean) => void;
};

export function HospitalDetailsDialog({
  hospital,
  facilityTypeName,
  sicknesses,
  isLoadingSicknesses,
  onEdit,
  onDelete,
  onOpenChange,
}: Props) {
  const showAlert = useAlert();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const remove = async () => {
    if (!hospital || isDeleting) return;
    setIsDeleting(true);
    try {
      const name = hospital.name;
      await onDelete(hospital.id);
      setDeleteOpen(false);
      onOpenChange(false);
      showAlert({
        title: "Сосудистый центр удалён",
        description: name,
        type: "success",
      });
    } catch (error) {
      showAlert({
        title: "Не удалось удалить центр",
        description: getHospitalsErrorMessage(error),
        type: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const hasCoordinates = Boolean(hospital?.latitude || hospital?.longitude);

  return (
    <>
      <Dialog
        open={hospital !== null}
        onOpenChange={(open) => {
          if (!open && (deleteOpen || isDeleting)) return;
          if (!open) setDeleteOpen(false);
          onOpenChange(open);
        }}
      >
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <div className="flex items-start gap-3 pr-8">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-black text-white">
                <Building2 className="size-5" />
              </span>
              <div className="min-w-0">
                <DialogTitle className="text-lg">
                  {hospital?.name ?? "Сосудистый центр"}
                </DialogTitle>
                <DialogDescription className="mt-1">
                  {facilityTypeName ?? "Тип учреждения не найден"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {hospital && (
            <div className="space-y-5">
              {hospital.description && (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {hospital.description}
                </p>
              )}

              <div className="divide-y rounded-xl border">
                <DetailsRow icon={<MapPin />} label="Адрес" value={hospital.address || "Не указан"} />
                <DetailsRow icon={<Phone />} label="Телефон" value={hospital.phone || "Не указан"} />
                <DetailsRow
                  icon={<MapPin />}
                  label="Координаты"
                  value={
                    hasCoordinates
                      ? `${hospital.latitude.toFixed(6)}, ${hospital.longitude.toFixed(6)}`
                      : "Не указаны"
                  }
                />
                <DetailsRow
                  icon={<CalendarClock />}
                  label="Обновлён"
                  value={formatDate(hospital.updated_at || hospital.created_at)}
                />
              </div>

              <section>
                <div className="mb-3 flex items-center gap-2">
                  <Stethoscope className="size-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium">Принимаемые направления</h3>
                </div>
                {isLoadingSicknesses ? (
                  <div className="flex items-center gap-2 rounded-xl border p-4 text-sm text-muted-foreground">
                    <LoaderCircle className="size-4 animate-spin" /> Загружаем направления…
                  </div>
                ) : sicknesses?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {sicknesses.map((sickness) => (
                      <span
                        key={sickness.id}
                        className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium"
                      >
                        {sickness.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                    Для центра пока не назначены медицинские направления.
                  </p>
                )}
              </section>
            </div>
          )}

          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="destructive"
              onClick={() => setDeleteOpen(true)}
              disabled={!hospital || isDeleting}
            >
              <Trash2 /> Удалить
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Закрыть
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (hospital) onEdit(hospital);
                }}
                disabled={!hospital || isLoadingSicknesses}
              >
                <Pencil /> Изменить
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeleteOpen(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить сосудистый центр?</DialogTitle>
            <DialogDescription>
              «{hospital?.name}» и его связи с заболеваниями будут удалены. Действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={isDeleting}
            >
              Отмена
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void remove()}
              disabled={isDeleting}
            >
              {isDeleting && <LoaderCircle className="animate-spin" />}
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function DetailsRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <span className="mt-0.5 text-muted-foreground [&_svg]:size-4">{icon}</span>
      <span className="w-24 shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="min-w-0 flex-1 text-right text-sm font-medium">{value}</span>
    </div>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
