import {
  ArrowUpRight,
  Building2,
  ChevronRight,
  MapPin,
  Phone,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Hospital } from "@/entities/hospital/model/types";

type HospitalsListProps = {
  hospitals: Hospital[];
  facilityTypeNames: Record<string, string>;
  onOpen: (hospital: Hospital) => void;
};

export function HospitalsGrid({
  hospitals,
  facilityTypeNames,
  onOpen,
}: HospitalsListProps) {
  return (
    <div className="grid content-start gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {hospitals.map((hospital) => (
        <button
          type="button"
          key={hospital.id}
          onClick={() => onOpen(hospital)}
          className="group relative flex min-h-44 flex-col justify-between rounded-xl bg-white p-4 text-left ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="line-clamp-2 font-medium">{hospital.name}</p>
              <p className="mt-1 truncate text-sm text-muted-foreground">
                {facilityTypeNames[hospital.facility_type_id] ?? "Тип не найден"}
              </p>
            </div>
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Building2 className="size-5" />
            </span>
          </div>

          <div className="mt-6 flex items-end justify-between gap-3">
            <div className="min-w-0 space-y-2 text-sm text-muted-foreground">
              <div className="flex min-w-0 items-center gap-2">
                <MapPin className="size-4 shrink-0" />
                <span className="truncate">{hospital.address || "Адрес не указан"}</span>
              </div>
              <div className="flex min-w-0 items-center gap-2">
                <Phone className="size-4 shrink-0" />
                <span className="truncate">{hospital.phone || "Телефон не указан"}</span>
              </div>
            </div>
            <ArrowUpRight className="size-5 shrink-0 rotate-45 text-muted-foreground opacity-0 transition group-hover:rotate-0 group-hover:opacity-100" />
          </div>
        </button>
      ))}
    </div>
  );
}

export function HospitalsTable({
  hospitals,
  facilityTypeNames,
  onOpen,
}: HospitalsListProps) {
  return (
    <div className="overflow-hidden rounded-xl bg-white ring-1 ring-black/5">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Сосудистый центр</TableHead>
            <TableHead>Тип</TableHead>
            <TableHead>Адрес</TableHead>
            <TableHead>Телефон</TableHead>
            <TableHead className="w-20">
              <span className="sr-only">Действия</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {hospitals.map((hospital) => (
            <TableRow
              key={hospital.id}
              tabIndex={0}
              role="link"
              className="cursor-pointer"
              onClick={() => onOpen(hospital)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onOpen(hospital);
                }
              }}
            >
              <TableCell>
                <div className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Building2 className="size-4" />
                  </span>
                  <span className="font-medium">{hospital.name}</span>
                </div>
              </TableCell>
              <TableCell>
                {facilityTypeNames[hospital.facility_type_id] ?? "Тип не найден"}
              </TableCell>
              <TableCell className="max-w-80 truncate text-muted-foreground">
                {hospital.address || "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {hospital.phone || "—"}
              </TableCell>
              <TableCell>
                <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
