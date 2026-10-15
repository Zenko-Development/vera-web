"use client";

import { Grid2X2, List, Plus, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { FilterPopover } from "@/components/ui/filter-popover";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toolbar } from "@/components/ui/toolbar";
import type { FacilityType } from "@/entities/facility-type/model/types";

export type HospitalsViewMode = "grid" | "table";
export type HospitalsSort = "name-asc" | "name-desc" | "updated-desc";

type Props = {
  query: string;
  facilityTypeId: string;
  sort: HospitalsSort;
  viewMode: HospitalsViewMode;
  isLoading: boolean;
  facilityTypes: FacilityType[];
  onQueryChange: (value: string) => void;
  onFacilityTypeChange: (value: string) => void;
  onSortChange: (value: HospitalsSort) => void;
  onViewModeChange: (value: HospitalsViewMode) => void;
  onRefresh: () => void;
  onCreate?: () => void;
};

export function HospitalsToolbar({
  query,
  facilityTypeId,
  sort,
  viewMode,
  isLoading,
  facilityTypes,
  onQueryChange,
  onFacilityTypeChange,
  onSortChange,
  onViewModeChange,
  onRefresh,
  onCreate,
}: Props) {
  return (
    <Toolbar className="mb-2">
      <InputGroup className="order-first h-8 min-w-0 basis-full bg-background shadow-none sm:basis-64 sm:flex-1">
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        <InputGroupInput
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Поиск центров"
          aria-label="Поиск сосудистых центров"
        />
      </InputGroup>

      <FilterPopover
        activeCount={Number(facilityTypeId !== "all")}
        onClear={() => onFacilityTypeChange("all")}
      >
        <div className="grid gap-2">
          <Label htmlFor="hospital-type-filter">Тип учреждения</Label>
          <Select value={facilityTypeId} onValueChange={(value) => onFacilityTypeChange(value ?? "all")}>
            <SelectTrigger id="hospital-type-filter" className="w-full bg-background shadow-none"><SelectValue /></SelectTrigger>
            <SelectContent align="start"><SelectGroup><SelectLabel>Тип учреждения</SelectLabel><SelectItem value="all">Все типы</SelectItem>{facilityTypes.map((type) => <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>)}</SelectGroup></SelectContent>
          </Select>
        </div>
        <div className="grid gap-2 border-t pt-4">
          <Label htmlFor="hospitals-sort">Сортировка</Label>
          <Select
            value={sort}
            onValueChange={(value) => onSortChange((value ?? "name-asc") as HospitalsSort)}
          >
            <SelectTrigger id="hospitals-sort" className="w-full bg-background shadow-none"><SelectValue /></SelectTrigger>
            <SelectContent align="start"><SelectGroup><SelectLabel>Сортировка</SelectLabel><SelectItem value="name-asc">Название: А–Я</SelectItem><SelectItem value="name-desc">Название: Я–А</SelectItem><SelectItem value="updated-desc">Недавно изменённые</SelectItem></SelectGroup></SelectContent>
          </Select>
        </div>
      </FilterPopover>

      <ButtonGroup orientation="horizontal" aria-label="Вид списка" className="ml-auto sm:ml-0">
        <Button
          type="button"
          variant={viewMode === "grid" ? "contrast" : "outline"}
          size="icon-sm"
          aria-label="Карточки"
          aria-pressed={viewMode === "grid"}
          onClick={() => onViewModeChange("grid")}
        >
          <Grid2X2 />
        </Button>
        <Button
          type="button"
          variant={viewMode === "table" ? "contrast" : "outline"}
          size="icon-sm"
          aria-label="Таблица"
          aria-pressed={viewMode === "table"}
          onClick={() => onViewModeChange("table")}
        >
          <List />
        </Button>
      </ButtonGroup>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label="Обновить сосудистые центры"
        onClick={onRefresh}
        disabled={isLoading}
      >
        <RefreshCw className={isLoading ? "animate-spin" : ""} />
      </Button>

      {onCreate && <Button type="button" size="sm" onClick={onCreate}>
        <Plus /> Новый центр
      </Button>}
    </Toolbar>
  );
}
