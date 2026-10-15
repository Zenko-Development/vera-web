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
    <Toolbar className="mb-2">
      <InputGroup className="order-first h-8 min-w-0 basis-full bg-background shadow-none sm:basis-64 sm:flex-1">
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        <InputGroupInput
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Поиск пользователей"
          aria-label="Поиск пользователей"
        />
      </InputGroup>

      <FilterPopover
        activeCount={Number(roleId !== "all") + Number(accessFilter !== "all")}
        onClear={() => {
          onRoleChange("all");
          onAccessFilterChange("all");
        }}
      >
        <div className="grid gap-2">
          <Label htmlFor="users-role-filter">Роль</Label>
          <Select
            value={roleId}
            onValueChange={(value) => onRoleChange(value ?? "all")}
          >
            <SelectTrigger id="users-role-filter" className="w-full bg-background shadow-none">
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
        </div>

        <div className="grid gap-2">
          <Label htmlFor="users-access-filter">Статус доступа</Label>
          <Select
            value={accessFilter}
            onValueChange={(value) =>
              onAccessFilterChange((value ?? "all") as UsersAccessFilter)
            }
          >
            <SelectTrigger id="users-access-filter" className="w-full bg-background shadow-none">
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
        </div>

        <div className="grid gap-2 border-t pt-4">
          <Label htmlFor="users-sort">Сортировка</Label>
          <Select
            value={sort}
            onValueChange={(value) =>
              onSortChange((value ?? "name-asc") as UsersSort)
            }
          >
            <SelectTrigger id="users-sort" className="w-full bg-background shadow-none">
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
        aria-label="Обновить пользователей"
        onClick={onRefresh}
        disabled={isLoading}
      >
        <RefreshCw className={isLoading ? "animate-spin" : ""} />
      </Button>

      <Button type="button" size="sm" onClick={onCreate}>
        <Plus /> Новый пользователь
      </Button>
    </Toolbar>
  );
}
