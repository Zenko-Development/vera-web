"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Ambulance,
  Building2,
  Clock3,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollFade } from "@/components/ui/scroll-fade";
import { hospitalArrivalApi } from "@/entities/hospital-arrival/api/hospital-arrival.api";
import type { HospitalArrival } from "@/entities/hospital-arrival/model/types";
import { fleetLiveApi } from "@/entities/fleet-live/api/fleet-live.api";
import type { FleetLiveVehicle } from "@/entities/fleet-live/model/types";
import { hospitalApi } from "@/entities/hospital/api/hospital.api";
import type { Hospital } from "@/entities/hospital/model/types";
import { getArrivalCoordinates } from "./map-data";

const LiveMap = dynamic(
  () => import("./map-canvas").then((module) => module.MapCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-background text-muted-foreground">
        <LoaderCircle className="size-4 animate-spin" />
        <span className="sr-only">Загружаем карту</span>
      </div>
    ),
  },
);

const refreshIntervalMs = 15_000;

function hasCoordinates(hospital: Hospital): boolean {
  return (
    Number.isFinite(hospital.latitude) &&
    Number.isFinite(hospital.longitude) &&
    !(hospital.latitude === 0 && hospital.longitude === 0)
  );
}

export function LiveMapWorkspace() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [arrivals, setArrivals] = useState<HospitalArrival[]>([]);
  const [fleet, setFleet] = useState<FleetLiveVehicle[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [showHospitals, setShowHospitals] = useState(true);
  const [showVehicles, setShowVehicles] = useState(true);

  const loadHospitals = useCallback(async () => {
    try {
      setHospitals(await hospitalApi.list());
    } catch {
      // The map remains usable with the data that was loaded previously.
    }
  }, []);

  const loadVehicles = useCallback(async () => {
    const [fleetResult, arrivalsResult] = await Promise.allSettled([
      fleetLiveApi.list(),
      hospitalArrivalApi.list(),
    ]);
    if (fleetResult.status === "fulfilled") setFleet(fleetResult.value);
    if (arrivalsResult.status === "fulfilled") setArrivals(arrivalsResult.value);
    if (fleetResult.status === "fulfilled" || arrivalsResult.status === "fulfilled") {
      setLastUpdatedAt(new Date());
    }
  }, []);

  useEffect(() => {
    let active = true;
    const initialLoad = window.setTimeout(() => {
      Promise.all([loadHospitals(), loadVehicles()]).finally(() => {
        if (active) setLoading(false);
      });
    }, 0);
    const interval = window.setInterval(
      () => void loadVehicles(),
      refreshIntervalMs,
    );
    return () => {
      active = false;
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
    };
  }, [loadHospitals, loadVehicles]);

  const mappedHospitals = useMemo(
    () => hospitals.filter(hasCoordinates),
    [hospitals],
  );
  const mappedVehiclesCount = useMemo(
    () => fleet
      ? fleet.filter((vehicle) => Number.isFinite(vehicle.latitude) && Number.isFinite(vehicle.longitude)).length
      : arrivals.filter((arrival) => getArrivalCoordinates(arrival)).length,
    [arrivals, fleet],
  );

  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([loadHospitals(), loadVehicles()]);
    setRefreshing(false);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 pb-5 pt-3">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-2 text-card-foreground">
        <Button
          type="button"
          size="sm"
          variant={showHospitals ? "default" : "ghost"}
          onClick={() => setShowHospitals((value) => !value)}
          aria-pressed={showHospitals}
        >
          <Building2 />
          Больницы
          <span className="opacity-60">{mappedHospitals.length}</span>
        </Button>
        <Button
          type="button"
          size="sm"
          variant={showVehicles ? "default" : "ghost"}
          onClick={() => setShowVehicles((value) => !value)}
          aria-pressed={showVehicles}
        >
          <Ambulance />
          Машины
          <span className="opacity-60">{fleet?.length ?? mappedVehiclesCount}</span>
        </Button>
        <div className="ml-auto flex items-center gap-3">
          {lastUpdatedAt && (
            <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
              <span className="size-2 rounded-full bg-emerald-500" />
              {lastUpdatedAt.toLocaleTimeString("ru-RU", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
          )}
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label="Обновить карту"
            onClick={() => void refresh()}
            disabled={refreshing}
          >
            <RefreshCw className={refreshing ? "animate-spin" : ""} />
          </Button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 overflow-hidden rounded-xl border bg-card text-card-foreground lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="relative isolate min-h-96 overflow-hidden lg:min-h-0">
          <LiveMap
            hospitals={showHospitals ? mappedHospitals : []}
            arrivals={showVehicles ? arrivals : []}
            fleet={showVehicles ? fleet ?? undefined : []}
          />
        </div>

        <aside
          className="min-h-0 overflow-hidden border-t lg:border-l lg:border-t-0"
          aria-label="Ожидаемые прибытия"
        >
          <ScrollFade
            className="h-full"
            viewportClassName="p-3"
            fadeClassName="from-card dark:from-card"
            edgeClassName="bg-card dark:bg-card"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-medium">Ожидаемые прибытия</h2>
              <span className="text-xs text-muted-foreground">{arrivals.length}</span>
            </div>

            {loading ? (
              <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                <LoaderCircle className="size-4 animate-spin" />
                Загрузка…
              </div>
            ) : arrivals.length === 0 ? (
              <p className="rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground">
                Ожидаемых машин сейчас нет.
              </p>
            ) : (
              <div className="space-y-2">
                {arrivals.map((arrival) => (
                  <article
                    key={arrival.emergency_call_id}
                    className="rounded-lg border p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium">{arrival.car_number}</p>
                        <Link
                          href={`/hospitals/${arrival.hospital_id}`}
                          className="mt-0.5 block truncate text-xs text-muted-foreground transition hover:text-foreground"
                        >
                          {arrival.hospital_name}
                        </Link>
                      </div>
                      <span
                        className={
                          arrival.location_is_fresh
                            ? "size-2 rounded-full bg-emerald-500"
                            : "size-2 rounded-full bg-amber-500"
                        }
                        title={
                          arrival.location_is_fresh
                            ? "Геопозиция актуальна"
                            : "Геопозиция устарела"
                        }
                      />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {Math.round(arrival.distance_meters / 100) / 10} км
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock3 className="size-3" />
                        {formatEta(arrival.estimated_arrival_at)}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </ScrollFade>
        </aside>
      </div>
    </div>
  );
}

function formatEta(value: string): string {
  return new Date(value).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
