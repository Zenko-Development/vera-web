import {
  ArrowUpRight,
  Building2,
  ChevronRight,
  MapPin,
  Pencil,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  onEdit: (hospital: Hospital) => void;
};

export function HospitalsGrid({
  hospitals,
  facilityTypeNames,
  onOpen,
  onEdit,
}: HospitalsListProps) {
  return (
    <div className="grid content-start gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {hospitals.map((hospital) => (
        <article
          key={hospital.id}
          className="group flex min-h-52 flex-col rounded-xl bg-white p-4 ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-black text-white">
              <Building2 className="size-5" />
            </span>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              onClick={() => onEdit(hospital)}
              aria-label={`Изменить ${hospital.name}`}
            >
              <Pencil />
            </Button>
          </div>

          <button
            type="button"
            onClick={() => onOpen(hospital)}
            className="mt-4 min-w-0 rounded-md text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <span className="line-clamp-2 font-medium">{hospital.name}</span>
            <span className="mt-1 block truncate text-xs text-muted-foreground">
              {facilityTypeNames[hospital.facility_type_id] ?? "Тип не найден"}
            </span>
          </button>

          <div className="mt-auto space-y-2 pt-5 text-sm text-muted-foreground">
            <div className="flex min-w-0 items-center gap-2">
              <MapPin className="size-4 shrink-0" />
              <span className="truncate">{hospital.address || "Адрес не указан"}</span>
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <Phone className="size-4 shrink-0" />
              <span className="truncate">{hospital.phone || "Телефон не указан"}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpen(hospital)}
            className="mt-4 flex items-center justify-between rounded-md text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Подробнее
            <ArrowUpRight className="size-4 rotate-45 text-muted-foreground transition group-hover:rotate-0" />
          </button>
        </article>
      ))}
    </div>
  );
}

export function HospitalsTable({
  hospitals,
  facilityTypeNames,
  onOpen,
  onEdit,
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
            <TableRow key={hospital.id}>
              <TableCell>
                <button
                  type="button"
                  onClick={() => onOpen(hospital)}
                  className="flex items-center gap-3 rounded-md text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-black text-white">
                    <Building2 className="size-4" />
                  </span>
                  <span className="font-medium">{hospital.name}</span>
                </button>
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
                <div className="flex items-center justify-end gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onEdit(hospital)}
                    aria-label={`Изменить ${hospital.name}`}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onOpen(hospital)}
                    aria-label={`Открыть ${hospital.name}`}
                  >
                    <ChevronRight />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
