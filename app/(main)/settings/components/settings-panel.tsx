"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronRight,
  KeyRound,
  LoaderCircle,
  Plus,
  RefreshCw,
  Settings2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { permissionApi } from "@/entities/permission/api/permission.api";
import type { Permission } from "@/entities/permission/model/types";
import { rolePermissionApi } from "@/entities/role-permission/api/role-permission.api";
import { roleApi } from "@/entities/role/api/role.api";
import type { Role } from "@/entities/role/model/types";
import { useAlert } from "@/features/alert/alert-store";
import { ApiError } from "@/shared/api/types";
import { API_V1 } from "@/shared/config/api";

type SettingsTab = "general" | "access";
type RolePermissionMap = Record<string, string[]>;

type AccessSnapshot = {
  roles: Role[];
  permissions: Permission[];
  rolePermissions: RolePermissionMap;
};

const sortRoles = (roles: Role[]) =>
  [...roles].sort((a, b) => a.name.localeCompare(b.name, "ru"));

const sortPermissions = (permissions: Permission[]) =>
  [...permissions].sort((a, b) => a.name.localeCompare(b.name, "ru"));

async function getAccessSnapshot(): Promise<AccessSnapshot> {
  const [roles, permissions] = await Promise.all([
    roleApi.list(),
    permissionApi.list(),
  ]);
  const sortedRoles = sortRoles(roles);

  const rolePermissionEntries = await Promise.all(
    sortedRoles.map(async (role) => {
      const assigned = await rolePermissionApi.listPermissions(role.id);
      return [role.id, assigned.map((permission) => permission.id)] as const;
    }),
  );

  return {
    roles: sortedRoles,
    permissions: sortPermissions(permissions),
    rolePermissions: Object.fromEntries(rolePermissionEntries),
  };
}

function getErrorMessage(error: unknown): string {
  if (ApiError.isApiError(error)) return error.getMessage();
  if (error instanceof Error) return error.message;
  return "Неизвестная ошибка";
}

function setsAreEqual(left: Set<string>, right: Set<string>): boolean {
  if (left.size !== right.size) return false;
  return [...left].every((value) => right.has(value));
}

export function SettingsPanel() {
  const showAlert = useAlert();
  const [activeTab, setActiveTab] = useState<SettingsTab>("access");
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] =
    useState<RolePermissionMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [initialPermissionIds, setInitialPermissionIds] = useState(
    () => new Set<string>(),
  );
  const [draftPermissionIds, setDraftPermissionIds] = useState(
    () => new Set<string>(),
  );
  const [isRolePermissionsLoading, setIsRolePermissionsLoading] =
    useState(false);
  const [isRolePermissionsSaving, setIsRolePermissionsSaving] = useState(false);
  const [roleDialogError, setRoleDialogError] = useState<string | null>(null);

  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [isRoleSaving, setIsRoleSaving] = useState(false);

  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);
  const [permissionName, setPermissionName] = useState("");
  const [permissionDescription, setPermissionDescription] = useState("");
  const [isPermissionSaving, setIsPermissionSaving] = useState(false);

  const hasPermissionChanges = useMemo(
    () => !setsAreEqual(initialPermissionIds, draftPermissionIds),
    [initialPermissionIds, draftPermissionIds],
  );

  useEffect(() => {
    let isActive = true;

    getAccessSnapshot()
      .then((snapshot) => {
        if (!isActive) return;
        setRoles(snapshot.roles);
        setPermissions(snapshot.permissions);
        setRolePermissions(snapshot.rolePermissions);
        setLoadError(null);
      })
      .catch((error: unknown) => {
        if (isActive) setLoadError(getErrorMessage(error));
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const snapshot = await getAccessSnapshot();
      setRoles(snapshot.roles);
      setPermissions(snapshot.permissions);
      setRolePermissions(snapshot.rolePermissions);
      setLoadError(null);
    } catch (error) {
      const message = getErrorMessage(error);
      setLoadError(message);
      showAlert({
        title: "Не удалось обновить настройки",
        description: message,
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadSelectedRolePermissions = async (role: Role) => {
    setIsRolePermissionsLoading(true);
    setRoleDialogError(null);
    try {
      const assigned = await rolePermissionApi.listPermissions(role.id);
      const ids = new Set(assigned.map((permission) => permission.id));
      setInitialPermissionIds(ids);
      setDraftPermissionIds(new Set(ids));
      setRolePermissions((current) => ({
        ...current,
        [role.id]: [...ids],
      }));
    } catch (error) {
      setRoleDialogError(getErrorMessage(error));
    } finally {
      setIsRolePermissionsLoading(false);
    }
  };

  const handleOpenRole = (role: Role) => {
    setSelectedRole(role);
    setInitialPermissionIds(new Set());
    setDraftPermissionIds(new Set());
    void loadSelectedRolePermissions(role);
  };

  const clearSelectedRole = () => {
    setSelectedRole(null);
    setInitialPermissionIds(new Set());
    setDraftPermissionIds(new Set());
    setRoleDialogError(null);
  };

  const handleCloseRole = () => {
    if (isRolePermissionsSaving) return;
    clearSelectedRole();
  };

  const handleDraftPermissionChange = (
    permissionId: string,
    checked: boolean,
  ) => {
    setDraftPermissionIds((current) => {
      const next = new Set(current);
      if (checked) next.add(permissionId);
      else next.delete(permissionId);
      return next;
    });
  };

  const handleSaveRolePermissions = async () => {
    if (!selectedRole || !hasPermissionChanges) return;

    const toAssign = [...draftPermissionIds].filter(
      (id) => !initialPermissionIds.has(id),
    );
    const toRevoke = [...initialPermissionIds].filter(
      (id) => !draftPermissionIds.has(id),
    );

    setIsRolePermissionsSaving(true);
    try {
      const operations = [
        ...toAssign.map((permissionId) =>
          rolePermissionApi.assign(selectedRole.id, permissionId),
        ),
        ...toRevoke.map((permissionId) =>
          rolePermissionApi.revoke(selectedRole.id, permissionId),
        ),
      ];
      const results = await Promise.allSettled(operations);
      const assigned = await rolePermissionApi.listPermissions(selectedRole.id);
      const actualIds = new Set(
        assigned.map((permission) => permission.id),
      );

      setInitialPermissionIds(actualIds);
      setDraftPermissionIds(new Set(actualIds));
      setRolePermissions((current) => ({
        ...current,
        [selectedRole.id]: [...actualIds],
      }));

      const failedCount = results.filter(
        (result) => result.status === "rejected",
      ).length;

      if (failedCount > 0) {
        showAlert({
          title: "Часть прав не сохранилась",
          description: `Не выполнено операций: ${failedCount}. Список синхронизирован с сервером.`,
          type: "error",
        });
        return;
      }

      showAlert({
        title: "Права роли сохранены",
        description: `Настройки роли «${selectedRole.name}» обновлены.`,
        type: "success",
      });
      clearSelectedRole();
    } catch (error) {
      showAlert({
        title: "Не удалось сохранить права",
        description: getErrorMessage(error),
        type: "error",
      });
    } finally {
      setIsRolePermissionsSaving(false);
    }
  };

  const handleCreateRole = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = roleName.trim();
    if (!name) return;

    setIsRoleSaving(true);
    try {
      const role = await roleApi.create({ name });
      setRoles((current) => sortRoles([...current, role]));
      setRolePermissions((current) => ({ ...current, [role.id]: [] }));
      setRoleName("");
      setIsRoleDialogOpen(false);
      showAlert({
        title: "Роль создана",
        description: `Роль «${role.name}» добавлена в список.`,
        type: "success",
      });
    } catch (error) {
      showAlert({
        title: "Не удалось создать роль",
        description: getErrorMessage(error),
        type: "error",
      });
    } finally {
      setIsRoleSaving(false);
    }
  };

  const handleCreatePermission = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    const name = permissionName.trim();
    if (!name) return;

    setIsPermissionSaving(true);
    try {
      const permission = await permissionApi.create({
        name,
        description: permissionDescription.trim(),
      });
      setPermissions((current) =>
        sortPermissions([...current, permission]),
      );
      setPermissionName("");
      setPermissionDescription("");
      setIsPermissionDialogOpen(false);
      showAlert({
        title: "Право создано",
        description: `Право «${permission.name}» теперь можно назначить роли.`,
        type: "success",
      });
    } catch (error) {
      showAlert({
        title: "Не удалось создать право",
        description: getErrorMessage(error),
        type: "error",
      });
    } finally {
      setIsPermissionSaving(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-row overflow-hidden rounded-xl bg-white ring-1 ring-black/5">
      <div
        className="flex flex-col gap-1 border-r p-2 min-w-40"
        role="tablist"
        aria-label="Разделы настроек"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "general"}
          onClick={() => setActiveTab("general")}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-gray-100 aria-selected:bg-black aria-selected:text-white"
        >
          <Settings2 className="size-4" />
          Общее
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "access"}
          onClick={() => setActiveTab("access")}
          className="flex items-center gap-2  rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-gray-100 aria-selected:bg-black aria-selected:text-white"
        >
          <ShieldCheck className="size-4 " />
          Роли и доступ
        </button>
      </div>

      {activeTab === "general" ? (
        <GeneralSettings />
      ) : (
        <section
          role="tabpanel"
          aria-label="Роли и доступ"
          className="min-h-0 flex-1 overflow-y-auto"
        >
          <div className=" w-full max-w-5xl p-5 md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl">
                <h2 className="text-xl font-semibold">Управление ролями</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Роли определяют, какие разделы и действия доступны
                  пользователю. Откройте роль, чтобы изменить набор её прав.
                </p>
              </div>
              <div className="flex items-center gap-2 w-full">
                <Input className="w-full h-8"/>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isLoading}
                >
                  <RefreshCw className={isLoading ? "animate-spin" : ""} />
                  Обновить
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPermissionDialogOpen(true)}
                >
                  <KeyRound /> Новое право
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setIsRoleDialogOpen(true)}
                >
                  <Plus /> Новая роль
                </Button>
              </div>
            </div>

            {loadError && !isLoading && (
              <div className="mt-5 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <span>Не удалось загрузить роли: {loadError}</span>
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                  Повторить
                </Button>
              </div>
            )}

            <div className="mt-6 overflow-hidden rounded-xl border">
              {isLoading ? (
                <LoadingBlock label="Загружаем роли" />
              ) : roles.length === 0 ? (
                <EmptyRoles onCreate={() => setIsRoleDialogOpen(true)} />
              ) : (
                <Table>
                  <TableBody>
                    {roles.map((role) => {
                      const permissionCount =
                        rolePermissions[role.id]?.length ?? 0;

                      return (
                        <TableRow key={role.id} className="group">
                          <TableCell className="p-0">
                            <button
                              type="button"
                              onClick={() => handleOpenRole(role)}
                              className="flex w-full items-center gap-4 px-4 py-4 text-left outline-none transition focus-visible:bg-muted/60 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                            >
                              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-gray-50 text-muted-foreground transition group-hover:text-foreground">
                                <ShieldCheck className="size-4" />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block font-semibold">
                                  {role.name}
                                </span>
                                <span className="mt-1 block truncate text-sm text-muted-foreground">
                                  Настройка доступа для пользователей этой роли
                                </span>
                              </span>
                              <span className="hidden rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-muted-foreground sm:inline-flex">
                                {permissionCount} {permissionCount === 1 ? "право" : "прав"}
                              </span>
                              <ChevronRight className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
                            </button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>

            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              Изменение названия и удаление ролей появятся после добавления
              соответствующих ручек на backend.
            </p>
          </div>
        </section>
      )}

      <Dialog
        open={selectedRole !== null}
        onOpenChange={(open) => {
          if (!open) handleCloseRole();
        }}
      >
        <DialogContent className="grid max-h-[85vh] grid-rows-[auto_minmax(0,1fr)_auto] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg">{selectedRole?.name}</DialogTitle>
            <DialogDescription>
              Отметьте права, которые должны быть доступны пользователям этой
              роли. Изменения применятся после сохранения.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 overflow-y-auto">
            {isRolePermissionsLoading ? (
              <LoadingBlock label="Загружаем права роли" />
            ) : roleDialogError ? (
              <div className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 p-5 text-center text-sm text-red-700">
                <p>Не удалось загрузить права: {roleDialogError}</p>
                {selectedRole && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() =>
                      void loadSelectedRolePermissions(selectedRole)
                    }
                  >
                    Повторить
                  </Button>
                )}
              </div>
            ) : permissions.length === 0 ? (
              <div className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed p-5 text-center">
                <KeyRound className="mb-3 size-5 text-muted-foreground" />
                <p className="text-sm font-medium">Права ещё не созданы</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Закройте окно и создайте первое право доступа.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border">
                {permissions.map((permission, index) => {
                  const checkboxId = `role-${selectedRole?.id}-permission-${permission.id}`;
                  const checked = draftPermissionIds.has(permission.id);

                  return (
                    <div
                      key={permission.id}
                      className={`flex items-start gap-3 px-4 py-3 transition hover:bg-gray-50 ${
                        index > 0 ? "border-t" : ""
                      }`}
                    >
                      <Checkbox
                        id={checkboxId}
                        checked={checked}
                        onCheckedChange={(nextChecked) =>
                          handleDraftPermissionChange(
                            permission.id,
                            nextChecked,
                          )
                        }
                        disabled={isRolePermissionsSaving}
                        className="mt-0.5"
                      />
                      <Label
                        htmlFor={checkboxId}
                        className="min-w-0 flex-1 cursor-pointer items-start"
                      >
                        <span className="min-w-0">
                          <span className="block font-medium leading-4">
                            {permission.name}
                          </span>
                          <span className="mt-1 block text-sm leading-relaxed font-normal text-muted-foreground">
                            {permission.description || "Без описания"}
                          </span>
                        </span>
                      </Label>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter className="border-t pt-4">
            <div className="mr-auto self-center text-xs text-muted-foreground">
              Выбрано: {draftPermissionIds.size} из {permissions.length}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseRole}
              disabled={isRolePermissionsSaving}
            >
              Отмена
            </Button>
            <Button
              type="button"
              onClick={handleSaveRolePermissions}
              disabled={
                isRolePermissionsLoading ||
                isRolePermissionsSaving ||
                roleDialogError !== null ||
                !hasPermissionChanges
              }
            >
              {isRolePermissionsSaving && (
                <LoaderCircle className="animate-spin" />
              )}
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <form onSubmit={handleCreateRole} className="contents">
            <DialogHeader>
              <DialogTitle>Новая роль</DialogTitle>
              <DialogDescription>
                Создайте роль, а затем откройте её в списке для назначения прав.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2">
              <Label htmlFor="new-role-name">Название роли</Label>
              <Input
                id="new-role-name"
                autoFocus
                required
                value={roleName}
                onChange={(event) => setRoleName(event.target.value)}
                placeholder="Например, dispatcher"
                disabled={isRoleSaving}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsRoleDialogOpen(false)}
                disabled={isRoleSaving}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={isRoleSaving || !roleName.trim()}>
                {isRoleSaving && <LoaderCircle className="animate-spin" />}
                Создать роль
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isPermissionDialogOpen}
        onOpenChange={setIsPermissionDialogOpen}
      >
        <DialogContent>
          <form onSubmit={handleCreatePermission} className="contents">
            <DialogHeader>
              <DialogTitle>Новое право доступа</DialogTitle>
              <DialogDescription>
                Используйте стабильное техническое имя, например
                checklist.read.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="new-permission-name">Техническое имя</Label>
                <Input
                  id="new-permission-name"
                  autoFocus
                  required
                  value={permissionName}
                  onChange={(event) => setPermissionName(event.target.value)}
                  placeholder="checklist.read"
                  disabled={isPermissionSaving}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-permission-description">Описание</Label>
                <Textarea
                  id="new-permission-description"
                  value={permissionDescription}
                  onChange={(event) =>
                    setPermissionDescription(event.target.value)
                  }
                  placeholder="Просмотр чеклистов"
                  disabled={isPermissionSaving}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPermissionDialogOpen(false)}
                disabled={isPermissionSaving}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                disabled={isPermissionSaving || !permissionName.trim()}
              >
                {isPermissionSaving && (
                  <LoaderCircle className="animate-spin" />
                )}
                Создать право
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function GeneralSettings() {
  return (
    <section
      role="tabpanel"
      aria-label="Общие настройки"
      className="w-full max-w-5xl p-5 md:p-8"
    >
      <div className="">
        <h2 className="font-semibold">Общие настройки</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Раздел подготовлен для общесистемных параметров. Доступные backend
          ручки сейчас покрывают только роли и права.
        </p>

        <div className="mt-6 divide-y rounded-xl border">
          <SettingRow
            title="Название системы"
            description="Отображается в интерфейсе и заголовке страницы"
            value="Вера"
          />
          <SettingRow
            title="Язык интерфейса"
            description="Локализация административной панели"
            value="Русский"
          />
          <SettingRow
            title="Адрес API"
            description="Текущий API v1 из конфигурации окружения"
            value={API_V1}
            mono
          />
        </div>
      </div>
    </section>
  );
}

function SettingRow({
  title,
  description,
  value,
  mono = false,
}: {
  title: string;
  description: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-8 px-4 py-4">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>
      <span
        className={`max-w-80 truncate text-sm ${
          mono ? "font-mono text-xs" : "font-medium"
        }`}
        title={value}
      >
        {value}
      </span>
    </div>
  );
}

function LoadingBlock({ label }: { label: string }) {
  return (
    <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-muted-foreground">
      <LoaderCircle className="size-4 animate-spin" />
      {label}
    </div>
  );
}

function EmptyRoles({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center p-6 text-center">
      <ShieldCheck className="mb-3 size-6 text-muted-foreground" />
      <p className="text-sm font-medium">Ролей пока нет</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Создайте первую роль, чтобы настроить доступ пользователей.
      </p>
      <Button type="button" size="sm" className="mt-4" onClick={onCreate}>
        <Plus /> Создать роль
      </Button>
    </div>
  );
}
