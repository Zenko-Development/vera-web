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
import type { Role } from "@/entities/role/model/types";
import { getRoleDisplayName } from "@/entities/role/lib/role-presenters";

export type UsersViewMode = "grid" | "table";
export type UsersSort = "name-asc" | "name-desc" | "username-asc";
export type UsersAccessFilter = "all" | "enabled" | "disabled";

type UsersToolbarProps = {
  query: string;
  roleId: string;
  accessFilter: UsersAccessFilter;
  sort: UsersSort;
  viewMode: UsersViewMode;
  roles: Role[];
  isLoading: boolean;
  onQueryChange: (value: string) => void;
  onRoleChange: (value: string) => void;
  onAccessFilterChange: (value: UsersAccessFilter) => void;
  onSortChange: (value: UsersSort) => void;
  onViewModeChange: (value: UsersViewMode) => void;
  onRefresh: () => void;
  onCreate: () => void;
};

export function UsersToolbar({
  query,
  roleId,
  accessFilter,
  sort,
  viewMode,
  roles,
  isLoading,
  onQueryChange,
  onRoleChange,
  onAccessFilterChange,
  onSortChange,
  onViewModeChange,
  onRefresh,
  onCreate,
}: UsersToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      <ButtonGroup orientation="horizontal" aria-label="Вид списка">
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
      <InputGroup className="h-8 min-w-56 flex-1 bg-background shadow-none">
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        <InputGroupInput
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Поиск по имени или имени пользователя"
          aria-label="Поиск пользователей"
        />
      </InputGroup>

      <Select
        value={roleId}
        onValueChange={(value) => onRoleChange(value ?? "all")}
      >
        <SelectTrigger className="w-44 bg-background shadow-none" size="sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="start">
          <SelectGroup>
            <SelectLabel>Роль</SelectLabel>
            <SelectItem value="all">Все роли</SelectItem>
            {roles.map((role) => (
              <SelectItem key={role.id} value={role.id}>
                {getRoleDisplayName(role.name)}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Select
        value={accessFilter}
        onValueChange={(value) =>
          onAccessFilterChange((value ?? "all") as UsersAccessFilter)
        }
      >
        <SelectTrigger className="w-40 bg-background shadow-none" size="sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="start">
          <SelectGroup>
            <SelectLabel>Доступ</SelectLabel>
            <SelectItem value="all">Любой статус</SelectItem>
            <SelectItem value="enabled">Активен</SelectItem>
            <SelectItem value="disabled">Отключён</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      <Select
        value={sort}
        onValueChange={(value) =>
          onSortChange((value ?? "name-asc") as UsersSort)
        }
      >
        <SelectTrigger className="w-48 bg-background shadow-none" size="sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="start">
          <SelectGroup>
            <SelectLabel>Сортировка</SelectLabel>
            <SelectItem value="name-asc">ФИО: А–Я</SelectItem>
            <SelectItem value="name-desc">ФИО: Я–А</SelectItem>
            <SelectItem value="username-asc">По имени пользователя</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      

      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label="Обновить пользователей"
        onClick={onRefresh}
        disabled={isLoading}
      >
        <RefreshCw className={isLoading ? "animate-spin" : ""} />
      </Button>

      <Button type="button" size="sm" onClick={onCreate}>
        <Plus /> Новый пользователь
      </Button>
    </div>
  );
}
