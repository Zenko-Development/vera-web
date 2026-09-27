"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Ambulance,
  ArrowRight,
  Clock3,
  Hospital,
  LoaderCircle,
  RefreshCw,
  Tablet,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollFade } from "@/components/ui/scroll-fade";
import { ambulanceVehicleApi } from "@/entities/ambulance-vehicle/api/ambulance-vehicle.api";
import type { AmbulanceVehicle } from "@/entities/ambulance-vehicle/model/types";
import { analyticsEmergencyCallApi } from "@/entities/analytics-emergency-call/api/analytics-emergency-call.api";
import type { AnalyticsEmergencyCall } from "@/entities/analytics-emergency-call/model/types";
import { deviceApi } from "@/entities/device/api/device.api";
import type { Device } from "@/entities/device/model/types";
import { hospitalArrivalApi } from "@/entities/hospital-arrival/api/hospital-arrival.api";
import type { HospitalArrival } from "@/entities/hospital-arrival/model/types";
import { hospitalApi } from "@/entities/hospital/api/hospital.api";
import type { Hospital as HospitalEntity } from "@/entities/hospital/model/types";
import { userApi } from "@/entities/user/api/user.api";
import type { User } from "@/entities/user/model/types";

const DashboardMap = dynamic(
  () => import("../map/components/map-canvas").then((module) => module.MapCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <LoaderCircle className="size-4 animate-spin" />
        <span className="sr-only">Загружаем карту</span>
      </div>
    ),
  },
);

type DashboardData = {
  users: User[] | null;
  vehicles: AmbulanceVehicle[] | null;
  devices: Device[] | null;
  hospitals: HospitalEntity[] | null;
  arrivals: HospitalArrival[] | null;
  calls: AnalyticsEmergencyCall[] | null;
};

const emptyData: DashboardData = {
  users: null,
  vehicles: null,
  devices: null,
  hospitals: null,
  arrivals: null,
  calls: null,
};

function fulfilledValue<T>(result: PromiseSettledResult<T>): T | null {
  return result.status === "fulfilled" ? result.value : null;
}

export function Dashboard() {
  const [data, setData] = useState<DashboardData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [users, vehicles, devices, hospitals, arrivals, calls] =
      await Promise.allSettled([
        userApi.list(),
        ambulanceVehicleApi.list(),
        deviceApi.list(),
        hospitalApi.list(),
        hospitalArrivalApi.list(),
        analyticsEmergencyCallApi.list({ limit: 5, offset: 0 }),
      ]);

    setData({
      users: fulfilledValue(users),
      vehicles: fulfilledValue(vehicles),
      devices: fulfilledValue(devices),
      hospitals: fulfilledValue(hospitals),
      arrivals: fulfilledValue(arrivals),
      calls: fulfilledValue(calls),
    });
    setUpdatedAt(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      hospitalArrivalApi
        .list()
        .then((arrivals) => {
          setData((current) => ({ ...current, arrivals }));
          setUpdatedAt(new Date());
        })
        .catch(() => undefined);
    }, 15_000);
    return () => window.clearInterval(interval);
  }, []);

  const deviceSummary = useMemo(() => {
    if (!data.devices) return null;
    const active = data.devices.filter((device) => device.status === "active").length;
    const withHeartbeat = data.devices.filter((device) => device.last_seen_at);
    const recent = withHeartbeat.filter((device) => {
      if (!device.last_seen_at) return false;
      return (updatedAt?.getTime() ?? 0) - new Date(device.last_seen_at).getTime() <= 5 * 60 * 1000;
    }).length;
    return { active, total: data.devices.length, recent, hasHeartbeat: withHeartbeat.length > 0 };
  }, [data.devices, updatedAt]);

  const activeUsers = data.users?.filter((user) => user.acces_status).length;
  const activeVehicles = data.vehicles?.filter((vehicle) => vehicle.status === "active").length;
  const mappedHospitals = useMemo(
    () =>
      (data.hospitals ?? []).filter(
        (hospital) =>
          Number.isFinite(hospital.latitude) &&
          Number.isFinite(hospital.longitude) &&
          !(hospital.latitude === 0 && hospital.longitude === 0),
      ),
    [data.hospitals],
  );

  return (
    <ScrollFade
      className="min-h-0 flex-1"
      viewportClassName="py-3 pb-6"
    >
      <main>
      <div className="mb-3 flex justify-end">
        <div className="flex items-center gap-3">
          {updatedAt && (
            <span className="text-xs text-muted-foreground">
              Обновлено {updatedAt.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={loading ? "animate-spin" : ""} />
            Обновить
          </Button>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Ключевые показатели">
        <MetricCard
          href="/users"
          icon={UsersRound}
          title="Пользователи с доступом"
          value={data.users ? `${activeUsers} / ${data.users.length}` : null}
          description="активные учётные записи"
          loading={loading && !updatedAt}
        />
        <MetricCard
          href="/fleet"
          icon={Ambulance}
          title="Активные машины"
          value={data.vehicles ? `${activeVehicles} / ${data.vehicles.length}` : null}
          description="доступны для начала смены"
          loading={loading && !updatedAt}
        />
        <MetricCard
          href="/fleet"
          icon={Tablet}
          title="Активные планшеты"
          value={deviceSummary ? `${deviceSummary.active} / ${deviceSummary.total}` : null}
          description={deviceSummary?.hasHeartbeat ? `На связи за 5 минут: ${deviceSummary.recent}` : "Heartbeat-данные пока не поступают"}
          loading={loading && !updatedAt}
        />
        <MetricCard
          href="/hospitals"
          icon={Hospital}
          title="Сосудистые центры"
          value={data.hospitals ? String(data.hospitals.length) : null}
          description="учреждений в системе"
          loading={loading && !updatedAt}
        />
      </section>

      <section
        className="relative isolate mt-3 h-80 overflow-hidden rounded-xl border bg-white xl:h-96"
        aria-label="Карта сосудистых центров и активных машин"
      >
        <DashboardMap
          hospitals={mappedHospitals}
          arrivals={data.arrivals ?? []}
        />
      </section>

      <section className="mt-3 grid min-h-80 gap-3 xl:grid-cols-2" aria-label="Оперативная информация">
        <ArrivalsCard arrivals={data.arrivals} loading={loading && !updatedAt} />
        <CallsCard calls={data.calls} loading={loading && !updatedAt} />
      </section>
      </main>
    </ScrollFade>
  );
}

function MetricCard({ href, icon: Icon, title, value, description, loading }: { href: string; icon: LucideIcon; title: string; value: string | null; description: string; loading: boolean }) {
  return (
    <Link href={href} className="group rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <Card className="h-full gap-4 transition group-hover:-translate-y-0.5 group-hover:shadow-md">
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
          <CardAction className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
            <Icon className="size-4" />
          </CardAction>
        </CardHeader>
        <CardContent className="gap-1">
          {loading ? <LoaderCircle className="my-1 size-6 animate-spin text-muted-foreground" /> : <p className="text-3xl font-semibold tracking-tight">{value ?? "—"}</p>}
          <p className="text-xs text-muted-foreground">{value === null && !loading ? "Нет доступа к данным" : description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

function ArrivalsCard({ arrivals, loading }: { arrivals: HospitalArrival[] | null; loading: boolean }) {
  const visible = arrivals?.slice(0, 5) ?? [];
  return (
    <Card className="gap-4">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2"><Clock3 className="size-4" />Ожидаемые прибытия</CardTitle>
        <CardDescription>Машины, направляющиеся в сосудистые центры</CardDescription>
        <CardAction><SectionLink href="/map" label="Открыть карту" /></CardAction>
      </CardHeader>
      <CardContent className="gap-0">
        {loading ? <LoadingRows /> : arrivals === null ? <EmptyState text="Нет доступа к данным прибытий." /> : visible.length === 0 ? <EmptyState text="Сейчас нет ожидаемых машин." /> : (
          <div className="divide-y">
            {visible.map((arrival) => (
              <div key={arrival.emergency_call_destination_id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted"><Ambulance className="size-4" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{arrival.car_number} · {arrival.hospital_name}</p>
                  <p className="truncate text-xs text-muted-foreground">{arrival.hospital_address}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-medium">{formatDuration(arrival.estimated_travel_seconds)}</p>
                  <p className={arrival.location_is_fresh ? "text-xs text-emerald-600" : "text-xs text-amber-600"}>{arrival.location_is_fresh ? "GPS актуален" : "GPS устарел"}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CallsCard({ calls, loading }: { calls: AnalyticsEmergencyCall[] | null; loading: boolean }) {
  return (
    <Card className="gap-4">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2"><Activity className="size-4" />Последние завершённые вызовы</CardTitle>
        <CardDescription>Недавние результаты прохождения форм</CardDescription>
        <CardAction><SectionLink href="/analytics" label="Вся аналитика" /></CardAction>
      </CardHeader>
      <CardContent className="gap-0">
        {loading ? <LoadingRows /> : calls === null ? <EmptyState text="Нет доступа к аналитике вызовов." /> : calls.length === 0 ? <EmptyState text="Завершённых вызовов пока нет." /> : (
          <div className="divide-y">
            {calls.map((call) => (
              <div key={call.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted"><Activity className="size-4" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{call.vehicle.car_number} · {call.checklist_run.result.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{call.destination?.selected_hospital?.name ?? "Больница не выбрана"}</p>
                </div>
                <time className="shrink-0 text-xs text-muted-foreground" dateTime={call.completed_at}>{formatDate(call.completed_at)}</time>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SectionLink({ href, label }: { href: string; label: string }) {
  return <Link href={href} className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition hover:text-foreground">{label}<ArrowRight className="size-3.5" /></Link>;
}

function LoadingRows() {
  return <div className="flex min-h-44 items-center justify-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" />Загрузка данных…</div>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="flex min-h-44 items-center justify-center rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">{text}</div>;
}

function formatDuration(seconds: number): string {
  const minutes = Math.max(1, Math.round(seconds / 60));
  return `${minutes} мин`;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}
