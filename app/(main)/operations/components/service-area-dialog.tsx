"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { Check, LoaderCircle, MapPin, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { HospitalServiceArea, HospitalServiceAreaRequest, ServiceAreaPoint } from "@/entities/hospital-service-area/model/types";
import type { Hospital } from "@/entities/hospital/model/types";

const ServiceAreaMap = dynamic(
  () => import("./service-area-map").then((module) => module.ServiceAreaMap),
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

type AreaSearchResult = {
  id: string;
  name: string;
  label: string;
  type: string | null;
  boundary: ServiceAreaPoint[];
  pointCount: number;
  source: "OpenStreetMap";
};

type ServiceAreaDialogProps = {
  open: boolean;
  target: HospitalServiceArea | "new" | null;
  hospital: Hospital | undefined;
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenChangeComplete: (open: boolean) => void;
  onSave: (data: HospitalServiceAreaRequest) => Promise<void>;
};

function boundaryToText(boundary: ServiceAreaPoint[]): string {
  return boundary.map(([latitude, longitude]) => `${latitude}, ${longitude}`).join("\n");
}

function parseBoundary(value: string): {
  boundary: ServiceAreaPoint[];
  error: string | null;
} {
  const lines = value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 3) {
    return { boundary: [], error: "Нужно минимум три вершины контура." };
  }

  const boundary: ServiceAreaPoint[] = [];
  for (const line of lines) {
    const values = line.split(",").map((part) => Number(part.trim()));
    if (values.length !== 2 || values.some((part) => !Number.isFinite(part))) {
      return { boundary: [], error: "Каждая строка должна иметь формат: широта, долгота." };
    }
    const [latitude, longitude] = values;
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return { boundary: [], error: "Координаты выходят за диапазон WGS 84." };
    }
    boundary.push([latitude, longitude]);
  }

  const first = boundary[0];
  const last = boundary.at(-1);
  if (!last || first[0] !== last[0] || first[1] !== last[1]) {
    boundary.push([...first]);
  }

  return { boundary, error: null };
}

export function ServiceAreaDialog({
  open,
  target,
  hospital,
  busy,
  onOpenChange,
  onOpenChangeComplete,
  onSave,
}: ServiceAreaDialogProps) {
  const isNew = target === "new" || target === null;
  const [areaName, setAreaName] = useState(isNew ? "" : target.name);
  const [boundaryText, setBoundaryText] = useState(
    isNew ? "" : boundaryToText(target.boundary),
  );
  const [priority, setPriority] = useState(isNew ? "0" : String(target.priority));
  const [active, setActive] = useState(isNew ? true : target.active);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AreaSearchResult[]>([]);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const parsedBoundary = useMemo(
    () => (boundaryText.trim() ? parseBoundary(boundaryText) : { boundary: [], error: null }),
    [boundaryText],
  );
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

  const searchAreas = async () => {
    const normalizedQuery = query.trim();
    if (normalizedQuery.length < 3) {
      setSearchError("Введите хотя бы 3 символа.");
      return;
    }

    setSearching(true);
    setSearchError(null);
    setResults([]);
    try {
      const response = await fetch(
        `/api/geocoding?kind=area&query=${encodeURIComponent(normalizedQuery)}`,
      );
      const payload = (await response.json()) as {
        data?: AreaSearchResult[];
        message?: string;
      };
      if (!response.ok) throw new Error(payload.message ?? "Поиск не выполнен");
      const nextResults = payload.data ?? [];
      setResults(nextResults);
      if (nextResults.length === 0) {
        setSearchError("Территории с доступной границей не найдены. Уточните район и город.");
      }
    } catch (cause) {
      setSearchError(cause instanceof Error ? cause.message : "Поиск не выполнен");
    } finally {
      setSearching(false);
    }
  };

  const selectArea = (result: AreaSearchResult) => {
    setSelectedResultId(result.id);
    setBoundaryText(boundaryToText(result.boundary));
    if (!areaName.trim()) setAreaName(result.name);
    setFormError(null);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!target || !hospital) return;
    if (!areaName.trim()) {
      setFormError("Укажите название зоны.");
      return;
    }
    if (parsedBoundary.error || parsedBoundary.boundary.length < 4) {
      setFormError(parsedBoundary.error ?? "Выберите территорию или задайте контур вручную.");
      return;
    }
    const parsedPriority = Number(priority);
    if (!Number.isInteger(parsedPriority)) {
      setFormError("Приоритет должен быть целым числом.");
      return;
    }

    setFormError(null);
    await onSave({
      hospital_id: hospital.id,
      name: areaName.trim(),
      boundary: parsedBoundary.boundary,
      priority: parsedPriority,
      active,
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && busy) return;
        onOpenChange(nextOpen);
      }}
      onOpenChangeComplete={onOpenChangeComplete}
    >
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-5xl">
        <form className="contents" onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>
              {target === "new" ? "Новая зона обслуживания" : "Изменить зону"}
            </DialogTitle>
            <DialogDescription>
              Найдите район, проверьте его границу на карте и только затем сохраните.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(340px,1.1fr)]">
            <div className="grid content-start gap-4">
              <div className="grid gap-2">
                <Label htmlFor="area-name">Название зоны</Label>
                <Input
                  id="area-name"
                  value={areaName}
                  onChange={(event) => setAreaName(event.target.value)}
                  placeholder="Например, Центральный район"
                  disabled={busy}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="area-query">Поиск территории</Label>
                <div className="flex gap-2">
                  <Input
                    id="area-query"
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setSearchError(null);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void searchAreas();
                      }
                    }}
                    placeholder="Район и город"
                    disabled={busy || searching}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void searchAreas()}
                    disabled={busy || searching || query.trim().length < 3}
                  >
                    {searching ? <LoaderCircle className="animate-spin" /> : <Search />}
                    Найти
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Поиск запускается только по кнопке или Enter. Добавьте город, если название района неоднозначно.
                </p>
              </div>

              {searchError && <p className="text-xs text-destructive">{searchError}</p>}

              {results.length > 0 && (
                <div className="max-h-48 overflow-y-auto rounded-xl border bg-background">
                  {results.map((result) => (
                    <button
                      key={result.id}
                      type="button"
                      onClick={() => selectArea(result)}
                      className="flex w-full items-start gap-3 border-b p-3 text-left transition last:border-b-0 hover:bg-muted/60"
                    >
                      <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">{result.name}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {result.label}
                        </span>
                        <span className="mt-1 block text-[11px] text-muted-foreground">
                          {result.pointCount} точек
                        </span>
                      </span>
                      {selectedResultId === result.id && (
                        <Check className="size-4 shrink-0 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="area-priority">Приоритет</Label>
                  <Input
                    id="area-priority"
                    type="number"
                    step="1"
                    value={priority}
                    onChange={(event) => setPriority(event.target.value)}
                    disabled={busy}
                    required
                  />
                </div>
                <div className="flex min-w-36 items-center justify-between gap-4 self-end rounded-lg border px-3 py-2.5">
                  <Label htmlFor="area-active">Активна</Label>
                  <Switch
                    id="area-active"
                    checked={active}
                    onCheckedChange={setActive}
                    disabled={busy}
                  />
                </div>
              </div>

              <details className="rounded-xl border bg-muted/20">
                <summary className="cursor-pointer px-3 py-2 text-sm font-medium">
                  Редактировать координаты вручную
                </summary>
                <div className="grid gap-2 border-t p-3">
                  <Textarea
                    aria-label="Координаты границы"
                    className="min-h-36 font-mono text-xs"
                    value={boundaryText}
                    onChange={(event) => {
                      setBoundaryText(event.target.value);
                      setSelectedResultId(null);
                      setFormError(null);
                    }}
                    placeholder={"55.70, 37.50\n55.70, 37.70\n55.85, 37.70"}
                    disabled={busy}
                  />
                  <p className="text-xs text-muted-foreground">
                    Одна вершина в строке: широта, долгота. Контур замыкается автоматически.
                  </p>
                  {parsedBoundary.error && boundaryText.trim() && (
                    <p className="text-xs text-destructive">{parsedBoundary.error}</p>
                  )}
                </div>
              </details>
            </div>

            <div className="overflow-hidden rounded-xl border bg-muted/20">
              <div className="flex items-center justify-between border-b px-3 py-2">
                <p className="text-sm font-medium">Предпросмотр территории</p>
                <span className="text-xs text-muted-foreground">
                  {parsedBoundary.boundary.length
                    ? `${parsedBoundary.boundary.length} точек`
                    : "Контур не выбран"}
                </span>
              </div>
              <div className="relative isolate z-0 h-[360px]">
                <ServiceAreaMap
                  boundary={parsedBoundary.boundary}
                  hospitalPoint={hospitalPoint}
                />
                {parsedBoundary.boundary.length === 0 && (
                  <div className="pointer-events-none absolute inset-x-4 top-4 z-500 rounded-lg bg-popover/90 p-3 text-center text-xs text-muted-foreground shadow-sm backdrop-blur-sm">
                    Найдите и выберите район — его граница появится здесь.
                  </div>
                )}
              </div>
              <p className="border-t px-3 py-2 text-xs text-muted-foreground">
                Импортированная административная граница требует визуальной проверки. Данные ©{" "}
                <a
                  href="https://www.openstreetmap.org/copyright"
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2"
                >
                  OpenStreetMap
                </a>
                .
              </p>
            </div>
          </div>

          {formError && <p className="text-sm text-destructive">{formError}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={busy}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={
                busy ||
                !areaName.trim() ||
                parsedBoundary.boundary.length < 4 ||
                Boolean(parsedBoundary.error)
              }
            >
              {busy && <LoaderCircle className="animate-spin" />}
              Сохранить зону
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
