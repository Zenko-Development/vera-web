"use client";

import { Grid2X2, List, Plus, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FacilityType } from "@/entities/facility-type/model/types";

export type HospitalsViewMode = "grid" | "table";
export type HospitalsSort = "name-asc" | "name-desc" | "updated-desc";

type Props = {
  query: string;
  facilityTypeId: string;
  sort: HospitalsSort;
  viewMode: HospitalsViewMode;
  facilityTypes: FacilityType[];
  isLoading: boolean;
  onQueryChange: (value: string) => void;
  onFacilityTypeChange: (value: string) => void;
  onSortChange: (value: HospitalsSort) => void;
  onViewModeChange: (value: HospitalsViewMode) => void;
  onRefresh: () => void;
  onCreate: () => void;
};

export function HospitalsToolbar({
  query,
  facilityTypeId,
  sort,
  viewMode,
  facilityTypes,
  isLoading,
  onQueryChange,
  onFacilityTypeChange,
  onSortChange,
  onViewModeChange,
  onRefresh,
  onCreate,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl bg-white p-3 ring-1 ring-black/5">
      <InputGroup className="min-w-64 flex-1 shadow-none">
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        <InputGroupInput
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Поиск по названию, адресу или телефону"
          aria-label="Поиск сосудистых центров"
        />
      </InputGroup>

      <Select
        value={facilityTypeId}
        onValueChange={(value) => onFacilityTypeChange(value ?? "all")}
      >
        <SelectTrigger className="w-52 bg-white shadow-none" size="sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="start">
          <SelectGroup>
            <SelectLabel>Тип учреждения</SelectLabel>
            <SelectItem value="all">Все типы</SelectItem>
            {facilityTypes.map((type) => (
              <SelectItem key={type.id} value={type.id}>
                {type.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Select
        value={sort}
        onValueChange={(value) =>
          onSortChange((value ?? "name-asc") as HospitalsSort)
        }
      >
        <SelectTrigger className="w-48 bg-white shadow-none" size="sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="start">
          <SelectGroup>
            <SelectLabel>Сортировка</SelectLabel>
            <SelectItem value="name-asc">Название: А–Я</SelectItem>
            <SelectItem value="name-desc">Название: Я–А</SelectItem>
            <SelectItem value="updated-desc">Недавно изменённые</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      <ButtonGroup orientation="horizontal" aria-label="Вид списка">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="Карточки"
          aria-pressed={viewMode === "grid"}
          className="aria-pressed:bg-black aria-pressed:text-white"
          onClick={() => onViewModeChange("grid")}
        >
          <Grid2X2 />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="Таблица"
          aria-pressed={viewMode === "table"}
          className="aria-pressed:bg-black aria-pressed:text-white"
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

      <Button type="button" size="sm" onClick={onCreate}>
        <Plus /> Создать
      </Button>
    </div>
  );
}
