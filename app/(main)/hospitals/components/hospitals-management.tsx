"use client";

import { useMemo, useState } from "react";
import { AlertCircle, Building2, Plus, SearchX } from "lucide-react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ScrollFade } from "@/components/ui/scroll-fade";
import type { Hospital } from "@/entities/hospital/model/types";
import { useAlert } from "@/features/alert/alert-store";
import { HospitalForm } from "./hospital-form";
import { HospitalsGrid, HospitalsTable } from "./hospitals-list";
import {
  HospitalsToolbar,
  type HospitalsSort,
  type HospitalsViewMode,
} from "./hospitals-toolbar";
import {
  getHospitalsErrorMessage,
  useHospitals,
} from "../hooks/use-hospitals";

export function HospitalsManagement() {
  const router = useRouter();
  const showAlert = useAlert();
  const {
    hospitals,
    facilityTypes,
    sicknesses,
    isLoading,
    error,
    refresh,
    loadHospitalSicknesses,
    createHospital,
    updateHospital,
  } = useHospitals();
  const [query, setQuery] = useState("");
  const [facilityTypeId, setFacilityTypeId] = useState("all");
  const [sort, setSort] = useState<HospitalsSort>("name-asc");
  const [viewMode, setViewMode] = useState<HospitalsViewMode>("grid");
  const [formTarget, setFormTarget] = useState<"new" | null>(null);

  const facilityTypeNames = useMemo(
    () => Object.fromEntries(facilityTypes.map((type) => [type.id, type.name])),
    [facilityTypes],
  );
  const openDetails = (hospital: Hospital) => {
    router.push(`/hospitals/${hospital.id}`);
  };

  const visibleHospitals = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ru");

    return hospitals
      .filter((hospital) => {
        const matchesType =
          facilityTypeId === "all" || hospital.facility_type_id === facilityTypeId;
        const searchValue = [
          hospital.name,
          hospital.description,
          hospital.address,
          hospital.phone,
          facilityTypeNames[hospital.facility_type_id] ?? "",
        ]
          .join(" ")
          .toLocaleLowerCase("ru");
        return matchesType && (!normalizedQuery || searchValue.includes(normalizedQuery));
      })
      .sort((left, right) => {
        if (sort === "updated-desc") {
          return Date.parse(right.updated_at) - Date.parse(left.updated_at);
        }
        const comparison = left.name.localeCompare(right.name, "ru");
        return sort === "name-desc" ? -comparison : comparison;
      });
  }, [facilityTypeId, facilityTypeNames, hospitals, query, sort]);

  const hasFilters = Boolean(query.trim()) || facilityTypeId !== "all";

  const clearFilters = () => {
    setQuery("");
    setFacilityTypeId("all");
  };

  const handleRefresh = async () => {
    try {
      await refresh();
    } catch (requestError) {
      showAlert({
        title: "Не удалось обновить сосудистые центры",
        description: getHospitalsErrorMessage(requestError),
        type: "error",
      });
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <HospitalsToolbar
        query={query}
        facilityTypeId={facilityTypeId}
        sort={sort}
        viewMode={viewMode}
        isLoading={isLoading}
        facilityTypes={facilityTypes}
        onQueryChange={setQuery}
        onFacilityTypeChange={setFacilityTypeId}
        onSortChange={setSort}
        onViewModeChange={setViewMode}
        onRefresh={() => void handleRefresh()}
        onCreate={() => setFormTarget("new")}
      />

      {error && !isLoading && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Не удалось загрузить сосудистые центры</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <ScrollFade
        className="min-h-0 flex-1"
        viewportClassName="py-1 pb-5"
      >
          {isLoading ? (
            <HospitalsLoading viewMode={viewMode} />
          ) : visibleHospitals.length === 0 ? (
            <HospitalsEmpty
              hasFilters={hasFilters}
              onClearFilters={clearFilters}
              onCreate={() => setFormTarget("new")}
            />
          ) : viewMode === "grid" ? (
            <HospitalsGrid
              hospitals={visibleHospitals}
              facilityTypeNames={facilityTypeNames}
              onOpen={openDetails}
            />
          ) : (
            <HospitalsTable
              hospitals={visibleHospitals}
              facilityTypeNames={facilityTypeNames}
              onOpen={openDetails}
            />
          )}
      </ScrollFade>

      <HospitalForm
        target={formTarget}
        facilityTypes={facilityTypes}
        sicknesses={sicknesses}
        onOpenChange={(open) => {
          if (!open) setFormTarget(null);
        }}
        onLoadSicknesses={loadHospitalSicknesses}
        onCreate={async (data, sicknessIds) => {
          const created = await createHospital(data, sicknessIds);
          router.push(`/hospitals/${created.id}`);
          return created;
        }}
        onUpdate={updateHospital}
      />
    </div>
  );
}

function HospitalsLoading({ viewMode }: { viewMode: HospitalsViewMode }) {
  if (viewMode === "table") {
    return (
      <div className="overflow-hidden rounded-xl bg-white ring-1 ring-black/5">
        {[0, 1, 2, 3, 4].map((item) => (
          <div key={item} className="flex items-center gap-3 border-b p-4 last:border-0">
            <div className="size-8 animate-pulse rounded-lg bg-gray-100" />
            <div className="h-4 w-56 animate-pulse rounded bg-gray-100" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {[0, 1, 2, 3, 4, 5, 6, 7].map((item) => (
        <div key={item} className="h-52 animate-pulse rounded-xl bg-white ring-1 ring-black/5" />
      ))}
    </div>
  );
}

function HospitalsEmpty({
  hasFilters,
  onClearFilters,
  onCreate,
}: {
  hasFilters: boolean;
  onClearFilters: () => void;
  onCreate: () => void;
}) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-dashed bg-white p-6 text-center">
      {hasFilters ? (
        <SearchX className="mb-3 size-7 text-muted-foreground" />
      ) : (
        <Building2 className="mb-3 size-7 text-muted-foreground" />
      )}
      <p className="font-medium">
        {hasFilters ? "Сосудистые центры не найдены" : "Сосудистых центров пока нет"}
      </p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {hasFilters
          ? "Попробуйте изменить поисковый запрос или тип учреждения."
          : "Создайте первый центр и укажите направления, по которым он принимает пациентов."}
      </p>
      <Button
        type="button"
        size="sm"
        variant={hasFilters ? "outline" : "default"}
        className="mt-4"
        onClick={hasFilters ? onClearFilters : onCreate}
      >
        {hasFilters ? (
          "Сбросить фильтры"
        ) : (
          <>
            <Plus /> Создать центр
          </>
        )}
      </Button>
    </div>
  );
}
