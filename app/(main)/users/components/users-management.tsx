"use client";

import { useMemo, useState } from "react";
import { AlertCircle, Plus, SearchX, UsersRound } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ScrollFade } from "@/components/ui/scroll-fade";
import type { User } from "@/entities/user/model/types";
import { useAlert } from "@/features/alert/alert-store";
import { getUserFullName, getUserSearchValue } from "../lib/user-presenters";
import { getUsersErrorMessage, useUsers } from "../hooks/use-users";
import { UserDetailsDialog } from "./user-details-dialog";
import { UserForm } from "./user-form";
import { UsersGrid } from "./users-grid";
import { UsersTable } from "./users-table";
import {
  UsersToolbar,
  type UsersAccessFilter,
  type UsersSort,
  type UsersViewMode,
} from "./users-toolbar";

export function UsersManagement() {
  const showAlert = useAlert();
  const {
    users,
    roles,
    isLoading,
    error,
    refresh,
    createUser,
    updateAccessStatus,
    updateRole,
  } = useUsers();
  const [query, setQuery] = useState("");
  const [roleId, setRoleId] = useState("all");
  const [accessFilter, setAccessFilter] =
    useState<UsersAccessFilter>("all");
  const [sort, setSort] = useState<UsersSort>("name-asc");
  const [viewMode, setViewMode] = useState<UsersViewMode>("grid");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<User["id"] | null>(null);

  const roleNames = useMemo(
    () => Object.fromEntries(roles.map((role) => [role.id, role.name])),
    [roles],
  );

  const visibleUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ru");

    return users
      .filter((user) => {
        const matchesQuery =
          !normalizedQuery ||
          getUserSearchValue(user).includes(normalizedQuery);
        const matchesRole = roleId === "all" || user.role_id === roleId;
        const matchesAccess =
          accessFilter === "all" ||
          (accessFilter === "enabled" && user.acces_status) ||
          (accessFilter === "disabled" && !user.acces_status);

        return matchesQuery && matchesRole && matchesAccess;
      })
      .sort((left, right) => {
        if (sort === "username-asc") {
          return left.user_name.localeCompare(right.user_name, "ru");
        }

        const comparison = getUserFullName(left).localeCompare(
          getUserFullName(right),
          "ru",
        );
        return sort === "name-desc" ? -comparison : comparison;
      });
  }, [accessFilter, query, roleId, sort, users]);

  const selectedUser = selectedUserId
    ? users.find((user) => user.id === selectedUserId) ?? null
    : null;

  const hasFilters =
    Boolean(query.trim()) || roleId !== "all" || accessFilter !== "all";

  const clearFilters = () => {
    setQuery("");
    setRoleId("all");
    setAccessFilter("all");
  };

  const handleRefresh = async () => {
    try {
      await refresh();
    } catch (requestError) {
      showAlert({
        title: "Не удалось обновить пользователей",
        description: getUsersErrorMessage(requestError),
        type: "error",
      });
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">

      <UsersToolbar
        query={query}
        roleId={roleId}
        accessFilter={accessFilter}
        sort={sort}
        viewMode={viewMode}
        roles={roles}
        isLoading={isLoading}
        onQueryChange={setQuery}
        onRoleChange={setRoleId}
        onAccessFilterChange={setAccessFilter}
        onSortChange={setSort}
        onViewModeChange={setViewMode}
        onRefresh={() => void handleRefresh()}
        onCreate={() => setIsCreateOpen(true)}
      />

      {error && !isLoading && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Не удалось загрузить пользователей</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <ScrollFade
        className="min-h-0 flex-1"
        viewportClassName="py-1 pb-5"
      >
        {isLoading ? (
          <UsersLoading viewMode={viewMode} />
        ) : visibleUsers.length === 0 ? (
          <UsersEmpty
            hasFilters={hasFilters}
            onClearFilters={clearFilters}
            onCreate={() => setIsCreateOpen(true)}
          />
        ) : viewMode === "grid" ? (
          <UsersGrid
            users={visibleUsers}
            roleNames={roleNames}
            onUserOpen={(user) => setSelectedUserId(user.id)}
          />
        ) : (
          <UsersTable
            users={visibleUsers}
            roleNames={roleNames}
            onUserOpen={(user) => setSelectedUserId(user.id)}
          />
        )}
      </ScrollFade>

      <UserForm
        open={isCreateOpen}
        roles={roles}
        onOpenChange={setIsCreateOpen}
        onCreate={createUser}
      />
      <UserDetailsDialog
        user={selectedUser}
        roles={roles}
        onAccessStatusChange={updateAccessStatus}
        onRoleChange={updateRole}
        onOpenChange={(open) => {
          if (!open) setSelectedUserId(null);
        }}
      />
    </div>
  );
}

function UsersLoading({ viewMode }: { viewMode: UsersViewMode }) {
  if (viewMode === "table") {
    return (
      <div className="overflow-hidden rounded-xl bg-white ring-1 ring-black/5">
        {[0, 1, 2, 3, 4].map((item) => (
          <div key={item} className="flex items-center gap-3 border-b p-4 last:border-0">
            <div className="size-8 animate-pulse rounded-full bg-gray-100" />
            <div className="h-4 w-48 animate-pulse rounded bg-gray-100" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {[0, 1, 2, 3, 4, 5, 6, 7].map((item) => (
        <div
          key={item}
          className="h-44 animate-pulse rounded-xl bg-white ring-1 ring-black/5"
        />
      ))}
    </div>
  );
}

function UsersEmpty({
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
        <SearchX className="mb-3 size-6 text-muted-foreground" />
      ) : (
        <UsersRound className="mb-3 size-6 text-muted-foreground" />
      )}
      <p className="font-medium">
        {hasFilters ? "Пользователи не найдены" : "Пользователей пока нет"}
      </p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {hasFilters
          ? "Попробуйте изменить поисковый запрос или фильтры."
          : "Создайте первую учётную запись пользователя."}
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
            <Plus /> Создать пользователя
          </>
        )}
      </Button>
    </div>
  );
}
