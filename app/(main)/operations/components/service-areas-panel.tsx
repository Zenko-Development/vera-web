"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { LoaderCircle, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  HospitalServiceArea,
  ServiceAreaPoint,
} from "@/entities/hospital-service-area/model/types";
import type { Hospital } from "@/entities/hospital/model/types";

const ServiceAreasOverviewMap = dynamic(
  () =>
    import("./service-area-map").then(
      (module) => module.ServiceAreasOverviewMap,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-muted/30 text-muted-foreground">
        <LoaderCircle className="size-4 animate-spin" />
        <span className="sr-only">Загружаем карту</span>
      </div>
    ),
  },
);

export function ServiceAreasPanel({
  areas,
  hospital,
  busy,
  onCreate,
  onEdit,
  onRemove,
}: {
  areas: HospitalServiceArea[];
  hospital: Hospital | undefined;
  busy: boolean;
  onCreate: () => void;
  onEdit: (area: HospitalServiceArea) => void;
  onRemove: (area: HospitalServiceArea) => void;
}) {
  const [highlightedAreaId, setHighlightedAreaId] = useState<string | null>(null);
  const hospitalPoint = useMemo<ServiceAreaPoint | null>(() => {
    if (
      !hospital ||
      !Number.isFinite(hospital.latitude) ||
      !Number.isFinite(hospital.longitude) ||
      (hospital.latitude === 0 && hospital.longitude === 0)
    ) {
      return null;
    }
    return [hospital.latitude, hospital.longitude];
  }, [hospital]);

  return (
    <section className="overflow-hidden rounded-xl border bg-background">
      <header className="flex items-center justify-between border-b p-4">
        <div>
          <h2 className="font-semibold">Зоны обслуживания</h2>
          <p className="text-sm text-muted-foreground">
            Наведите на строку, чтобы выделить территорию на карте
          </p>
        </div>
        <Button size="sm" onClick={onCreate}>
          <Plus />
          Добавить
        </Button>
      </header>

      <div className="grid min-h-96 xl:grid-cols-[minmax(480px,0.9fr)_minmax(360px,1.1fr)]">
        <div className="min-w-0 overflow-x-auto border-b xl:border-b-0 xl:border-r">
          {areas.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Приоритет</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="w-32" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {areas.map((area) => (
                  <TableRow
                    key={area.id}
                    className={
                      highlightedAreaId === area.id ? "bg-muted/70" : undefined
                    }
                    onMouseEnter={() => setHighlightedAreaId(area.id)}
                    onMouseLeave={() => setHighlightedAreaId(null)}
                    onFocusCapture={() => setHighlightedAreaId(area.id)}
                    onBlurCapture={() => setHighlightedAreaId(null)}
                  >
                    <TableCell className="font-medium">{area.name}</TableCell>
                    <TableCell>{area.priority}</TableCell>
                    <TableCell>
                      {area.active ? "Активна" : "Отключена"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onEdit(area)}
                          disabled={busy}
                        >
                          Изменить
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label={`Удалить зону ${area.name}`}
                          onClick={() => onRemove(area)}
                          disabled={busy}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex h-full min-h-64 items-center justify-center p-6">
              <div className="text-center">
                <p className="text-sm font-medium">Зоны не настроены</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Добавьте первую территорию обслуживания.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="relative isolate z-0 min-h-80 overflow-hidden">
          <ServiceAreasOverviewMap
            areas={areas}
            hospitalPoint={hospitalPoint}
            highlightedAreaId={highlightedAreaId}
          />
          {areas.length === 0 && (
            <div className="pointer-events-none absolute inset-x-4 top-4 z-500 rounded-lg bg-popover/90 p-3 text-center text-xs text-muted-foreground shadow-sm backdrop-blur-sm">
              Созданные зоны появятся на этой карте.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
