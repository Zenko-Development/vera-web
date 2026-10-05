"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { Ambulance, LoaderCircle } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { HospitalArrival } from "@/entities/hospital-arrival/model/types";
import type { Hospital } from "@/entities/hospital/model/types";
import { getArrivalCoordinates } from "../../map/components/map-data";

const ArrivalsMap = dynamic(
  () => import("../../map/components/map-canvas").then((module) => module.MapCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-muted/30 text-muted-foreground">
        <LoaderCircle className="size-4 animate-spin" />
        <span className="sr-only">Загружаем карту прибытия</span>
      </div>
    ),
  },
);

function hasCoordinates(hospital: Hospital): boolean {
  return (
    Number.isFinite(hospital.latitude) &&
    Number.isFinite(hospital.longitude) &&
    !(hospital.latitude === 0 && hospital.longitude === 0)
  );
}

export function HospitalArrivalsPanel({
  hospital,
  arrivals,
}: {
  hospital: Hospital | undefined;
  arrivals: HospitalArrival[];
}) {
  const mappedHospitals = useMemo(
    () => (hospital && hasCoordinates(hospital) ? [hospital] : []),
    [hospital],
  );
  const mappedVehiclesCount = useMemo(
    () => arrivals.filter((arrival) => getArrivalCoordinates(arrival)).length,
    [arrivals],
  );

  return (
    <section className="flex min-h-full flex-col overflow-hidden rounded-xl border bg-background xl:h-full xl:min-h-0">
      <header className="flex items-center justify-between gap-3 border-b p-4">
        <div>
          <h2 className="font-semibold">Ожидаемые машины</h2>
          <p className="text-sm text-muted-foreground">
            Данные и позиции обновляются автоматически каждые 15 секунд
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Ambulance className="size-4" />
          <span>{mappedVehiclesCount} на карте</span>
        </div>
      </header>

      <div className="grid min-h-96 flex-1 xl:min-h-0 xl:grid-cols-[minmax(440px,0.9fr)_minmax(400px,1.1fr)]">
        <div className="min-w-0 overflow-y-auto border-b p-4 xl:min-h-0 xl:border-b-0 xl:border-r">
          {arrivals.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              {arrivals.map((arrival) => (
                <Card key={arrival.emergency_call_id} size="sm">
                  <CardHeader>
                    <CardTitle>{arrival.car_number}</CardTitle>
                    <CardDescription>{arrival.hospital_name}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <p>
                      Прибытие: <strong>{formatDate(arrival.estimated_arrival_at)}</strong>
                    </p>
                    <p>
                      Расстояние: {Math.round(arrival.distance_meters / 100) / 10} км
                    </p>
                    <p
                      className={
                        arrival.location_is_fresh
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "font-medium text-destructive"
                      }
                    >
                      {arrival.location_is_fresh ? "Геопозиция актуальна" : "Геопозиция устарела"}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex min-h-72 items-center justify-center rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Активных прибытий сейчас нет.
            </div>
          )}
        </div>

        <div className="relative isolate z-0 min-h-80 overflow-hidden xl:min-h-0">
          <ArrivalsMap hospitals={mappedHospitals} arrivals={arrivals} />
          {mappedVehiclesCount === 0 && (
            <div className="pointer-events-none absolute inset-x-4 top-4 z-500 rounded-lg bg-popover/90 p-3 text-center text-xs text-muted-foreground shadow-sm backdrop-blur-sm">
              Машины с доступной геопозицией появятся здесь автоматически.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
