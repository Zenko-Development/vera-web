"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronRight,
  KeyRound,
  Library,
  LoaderCircle,
  Plus,
  RefreshCw,
  Satellite,
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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { ScrollFade } from "@/components/ui/scroll-fade";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { geoTrackingPolicyApi } from "@/entities/geo-tracking-policy/api/geo-tracking-policy.api";
import type { GeoTrackingPolicy } from "@/entities/geo-tracking-policy/model/types";
import { permissionApi } from "@/entities/permission/api/permission.api";
import { getPermissionDisplayName } from "@/entities/permission/lib/permission-presenters";
import type { Permission } from "@/entities/permission/model/types";
import { rolePermissionApi } from "@/entities/role-permission/api/role-permission.api";
import { roleApi } from "@/entities/role/api/role.api";
import { getRoleDisplayName } from "@/entities/role/lib/role-presenters";
import type { Role } from "@/entities/role/model/types";
import { useAlert } from "@/features/alert/alert-store";
import { usePermissions } from "@/features/auth/use-permissions";
import { useUserPreference } from "@/features/preferences/use-user-preference";
import {
  useUnsavedChanges,
  useUnsavedNavigation,
} from "@/features/unsaved-changes/unsaved-changes-provider";
import { ApiError } from "@/shared/api/types";
import { API_V1 } from "@/shared/config/api";
import { CatalogsSettings } from "./catalogs-settings";
import { SettingsSection, SettingsSectionHeader } from "./settings-section";

export type SettingsTab = "general" | "gps" | "catalogs" | "access";
type RolePermissionMap = Record<string, string[]>;

const isSettingsTab = (value: unknown): value is SettingsTab =>
  value === "general" ||
  value === "gps" ||
  value === "catalogs" ||
  value === "access";

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

export function SettingsPanel({ initialTab }: { initialTab?: SettingsTab }) {
  const showAlert = useAlert();
  const { can, canAny } = usePermissions();
  const { requestNavigation } = useUnsavedNavigation();
  const [activeTab, setActiveTab] = useUserPreference(
    "settings:last-tab",
    initialTab ?? "general",
    isSettingsTab,
  );
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] =
    useState<RolePermissionMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [accessLoaded, setAccessLoaded] = useState(false);
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
  const [roleQuery, setRoleQuery] = useState("");
  const [isRoleSaving, setIsRoleSaving] = useState(false);

  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);
  const [permissionName, setPermissionName] = useState("");
  const [permissionDescription, setPermissionDescription] = useState("");
  const [isPermissionSaving, setIsPermissionSaving] = useState(false);

  const hasPermissionChanges = useMemo(
    () => !setsAreEqual(initialPermissionIds, draftPermissionIds),
    [initialPermissionIds, draftPermissionIds],
  );
  const visibleRoles = useMemo(() => {
    const query = roleQuery.trim().toLocaleLowerCase("ru-RU");
    if (!query) return roles;
    return roles.filter((role) => `${role.name} ${getRoleDisplayName(role.name)}`.toLocaleLowerCase("ru-RU").includes(query));
  }, [roleQuery, roles]);

  const canManageAccess = can("rbac.manage");
  const canManageGps = can("geo_tracking_policy.manage");
  const canManageCatalogs = canAny([
    "sickness.manage",
    "facility_type.manage",
    "hospital_resource.read",
  ]);
  const availableTabs = useMemo(() => {
    const tabs: Array<{ id: SettingsTab; label: string; icon: typeof Settings2 }> = [];
    if (canManageAccess) tabs.push({ id: "general", label: "Общее", icon: Settings2 });
    if (canManageGps) tabs.push({ id: "gps", label: "Геопозиция и прибытие", icon: Satellite });
    if (canManageCatalogs) tabs.push({ id: "catalogs", label: "Справочники", icon: Library });
    if (canManageAccess) tabs.push({ id: "access", label: "Роли и доступ", icon: ShieldCheck });
    return tabs;
  }, [canManageAccess, canManageCatalogs, canManageGps]);
  const resolvedActiveTab = availableTabs.some((tab) => tab.id === activeTab)
    ? activeTab
    : availableTabs[0]?.id ?? "general";

  useEffect(() => {
    if (initialTab && availableTabs.some((tab) => tab.id === initialTab)) {
      setActiveTab(initialTab);
    }
  }, [availableTabs, initialTab, setActiveTab]);

  useEffect(() => {
    if (activeTab !== resolvedActiveTab) setActiveTab(resolvedActiveTab);
  }, [activeTab, resolvedActiveTab, setActiveTab]);

  useEffect(() => {
    if (!canManageAccess || resolvedActiveTab !== "access" || accessLoaded) return;
    let isActive = true;

    getAccessSnapshot()
      .then((snapshot) => {
        if (!isActive) return;
        setRoles(snapshot.roles);
        setPermissions(snapshot.permissions);
        setRolePermissions(snapshot.rolePermissions);
        setLoadError(null);
        setAccessLoaded(true);
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
  }, [accessLoaded, canManageAccess, resolvedActiveTab]);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const snapshot = await getAccessSnapshot();
      setRoles(snapshot.roles);
      setPermissions(snapshot.permissions);
      setRolePermissions(snapshot.rolePermissions);
      setLoadError(null);
      setAccessLoaded(true);
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
    if (hasPermissionChanges) requestNavigation(clearSelectedRole);
    else clearSelectedRole();
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

  const handleSaveRolePermissions = async (): Promise<boolean> => {
    if (!selectedRole || !hasPermissionChanges) return true;

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
        return true;
      }

      showAlert({
        title: "Права роли сохранены",
        description: `Настройки роли «${selectedRole.name}» обновлены.`,
        type: "success",
      });
      clearSelectedRole();
      return true;
    } catch (error) {
      showAlert({
        title: "Не удалось сохранить права",
        description: getErrorMessage(error),
        type: "error",
      });
      return false;
    } finally {
      setIsRolePermissionsSaving(false);
    }
  };

  useUnsavedChanges({
    active: selectedRole !== null && hasPermissionChanges,
    onSave: handleSaveRolePermissions,
    onDiscard: clearSelectedRole,
  });

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
        description: `Роль «${getRoleDisplayName(role.name)}» добавлена в список.`,
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
        description: `Право «${getPermissionDisplayName(permission.name)}» теперь можно назначить роли.`,
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
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl bg-card text-card-foreground ring-1 ring-border md:flex-row">
      <div
        className="flex shrink-0 flex-row gap-1 overflow-x-auto border-b p-2 md:min-w-40 md:flex-col md:border-r md:border-b-0"
        role="tablist"
        aria-label="Разделы настроек"
      >
        {availableTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={resolvedActiveTab === tab.id}
              onClick={() => requestNavigation(() => setActiveTab(tab.id))}
              className="flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-muted aria-selected:bg-primary aria-selected:text-primary-foreground"
            >
              <Icon className="size-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {resolvedActiveTab === "general" ? (
        <GeneralSettings />
      ) : resolvedActiveTab === "gps" ? (
        <GpsSettings />
      ) : resolvedActiveTab === "catalogs" ? (
        <CatalogsSettings />
      ) : (
        <SettingsSection ariaLabel="Роли и доступ">
          <SettingsSectionHeader
            title="Управление ролями"
            description="Роли определяют, какие разделы и действия доступны пользователю. Откройте роль, чтобы изменить набор её прав."
            action={
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
            }
          />
          <div className="mt-5 flex w-full items-center gap-2">
            <Input
              className="h-8 w-full"
              value={roleQuery}
              onChange={(event) => setRoleQuery(event.target.value)}
              placeholder="Найти роль"
              aria-label="Поиск ролей"
            />
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

          {loadError && !isLoading && (
            <div className="mt-5 flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
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
                  {visibleRoles.length === 0 ? (
                    <TableRow>
                      <TableCell className="py-10 text-center text-sm text-muted-foreground">
                        Роли по запросу не найдены
                      </TableCell>
                    </TableRow>
                  ) : visibleRoles.map((role) => {
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
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/50 text-muted-foreground transition group-hover:text-foreground">
                              <ShieldCheck className="size-4" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block font-semibold">
                                {getRoleDisplayName(role.name)}
                              </span>
                              <span className="mt-1 block truncate text-sm text-muted-foreground">
                                Настройка доступа для пользователей этой роли
                              </span>
                            </span>
                            <span className="hidden rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground sm:inline-flex">
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
            соответствующих серверных методов.
          </p>
        </SettingsSection>
      )}

      <Dialog
        open={selectedRole !== null}
        onOpenChange={(open) => {
          if (!open) handleCloseRole();
        }}
      >
        <DialogContent className="grid max-h-[85vh] grid-rows-[auto_minmax(0,1fr)_auto] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg">{selectedRole ? getRoleDisplayName(selectedRole.name) : "Роль"}</DialogTitle>
            <DialogDescription>
              Отметьте права, которые должны быть доступны пользователям этой
              роли. Изменения применятся после сохранения.
            </DialogDescription>
          </DialogHeader>

          <ScrollFade
            className="min-h-0"
            fadeClassName="from-popover dark:from-popover"
            edgeClassName="bg-popover dark:bg-popover"
          >
            {isRolePermissionsLoading ? (
              <LoadingBlock label="Загружаем права роли" />
            ) : roleDialogError ? (
              <div className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/10 p-5 text-center text-sm text-destructive">
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
                      className={`flex items-start gap-3 px-4 py-3 transition hover:bg-muted/50 ${
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
                            {getPermissionDisplayName(permission.name)}
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
          </ScrollFade>

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
            {hasPermissionChanges && (
              <Button
                type="button"
                onClick={() => void handleSaveRolePermissions()}
                disabled={
                  isRolePermissionsLoading ||
                  isRolePermissionsSaving ||
                  roleDialogError !== null
                }
              >
                {isRolePermissionsSaving && (
                  <LoaderCircle className="animate-spin" />
                )}
                Сохранить
              </Button>
            )}
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
                placeholder="Например, диспетчер"
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
                Используйте стабильное техническое имя без пробелов.
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
                  placeholder="Введите техническое имя"
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
                  placeholder="Просмотр форм"
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
    <SettingsSection ariaLabel="Общие настройки">
      <SettingsSectionHeader
        title="Общие настройки"
        description="Основные параметры интерфейса и подключения."
      />
      <div className="mt-6 divide-y rounded-xl border">
        <SettingRow title="Название системы" description="Отображается в интерфейсе и заголовке страницы" value="Вера" />
        <SettingRow title="Язык интерфейса" description="Локализация административной панели" value="Русский" />
        <SettingRow title="Адрес сервера" description="Текущий адрес серверного интерфейса из конфигурации окружения" value={API_V1} mono />
      </div>
    </SettingsSection>
  );
}

function GpsSettings() {
  const showAlert = useAlert();
  const [policy, setPolicy] = useState<GeoTrackingPolicy | null>(null);
  const [savedPolicy, setSavedPolicy] = useState<GeoTrackingPolicy | null>(null);
  const [policyError, setPolicyError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    geoTrackingPolicyApi.get().then((loadedPolicy) => {
      setPolicy(loadedPolicy);
      setSavedPolicy(loadedPolicy);
    }).catch((error) => setPolicyError(getErrorMessage(error)));
  }, []);

  const hasChanges = Boolean(
    policy &&
    savedPolicy &&
    (
      policy.active_call_interval_seconds !== savedPolicy.active_call_interval_seconds ||
      policy.device_location_interval_seconds !== savedPolicy.device_location_interval_seconds ||
      policy.max_accuracy_meters !== savedPolicy.max_accuracy_meters ||
      policy.location_freshness_seconds !== savedPolicy.location_freshness_seconds ||
      policy.eta_average_speed_kmh !== savedPolicy.eta_average_speed_kmh ||
      policy.eta_road_distance_factor !== savedPolicy.eta_road_distance_factor
    ),
  );

  const setNumber = (field: keyof Omit<GeoTrackingPolicy, "updated_at">, value: string) => {
    const number = Number(value);
    if (!Number.isFinite(number)) return;
    setPolicy((current) => current ? { ...current, [field]: number } : current);
  };

  const save = async (): Promise<boolean> => {
    if (!policy) return false;
    setSaving(true);
    try {
      const updated = await geoTrackingPolicyApi.update({
        active_call_interval_seconds: policy.active_call_interval_seconds,
        device_location_interval_seconds: policy.device_location_interval_seconds,
        max_accuracy_meters: policy.max_accuracy_meters,
        location_freshness_seconds: policy.location_freshness_seconds,
        eta_average_speed_kmh: policy.eta_average_speed_kmh,
        eta_road_distance_factor: policy.eta_road_distance_factor,
      });
      setPolicy(updated);
      setSavedPolicy(updated);
      setPolicyError(null);
      showAlert({ title: "Политика геопозиции сохранена", type: "success" });
      return true;
    } catch (error) {
      showAlert({ title: "Не удалось сохранить политику геопозиции", description: getErrorMessage(error), type: "error" });
      return false;
    } finally { setSaving(false); }
  };

  useUnsavedChanges({
    active: hasChanges,
    onSave: save,
    onDiscard: () => setPolicy(savedPolicy),
  });

  return (
    <SettingsSection ariaLabel="Геопозиция и время прибытия">
      <SettingsSectionHeader
        title="Геопозиция и расчёт времени прибытия"
        description="Политика определяет частоту отправки координат, допустимую точность и параметры приблизительного прогноза прибытия."
        action={hasChanges ? (
          <Button size="sm" onClick={() => void save()} disabled={!policy || saving}>
            {saving && <LoaderCircle className="animate-spin" />}
            Сохранить
          </Button>
        ) : undefined}
      />

      {policyError ? (
        <p className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{policyError}</p>
      ) : !policy ? (
        <LoadingBlock label="Загружаем политику геопозиции" />
      ) : (
        <div className="mt-6 divide-y rounded-xl border">
          <PolicyField label="Интервал отправки координат" description="Как часто планшет отправляет координаты во время активного вызова" suffix="сек." value={policy.active_call_interval_seconds} min={5} max={300} onChange={(value) => setNumber("active_call_interval_seconds", value)} />
          <PolicyField label="Интервал позиции планшета" description="Как часто планшет передаёт общую позицию во время активной смены" suffix="сек." value={policy.device_location_interval_seconds} min={5} max={600} onChange={(value) => setNumber("device_location_interval_seconds", value)} />
          <PolicyField label="Допустимая точность" description="Точки с худшей точностью сервер отклонит" suffix="м" value={policy.max_accuracy_meters} min={0.1} max={10000} onChange={(value) => setNumber("max_accuracy_meters", value)} />
          <PolicyField label="Срок свежести координаты" description="После этого времени прогноз прибытия помечается как устаревший" suffix="сек." value={policy.location_freshness_seconds} min={15} max={3600} onChange={(value) => setNumber("location_freshness_seconds", value)} />
          <PolicyField label="Средняя скорость скорой" description="Используется только для приблизительного расчёта времени прибытия" suffix="км/ч" value={policy.eta_average_speed_kmh} min={10} max={180} onChange={(value) => setNumber("eta_average_speed_kmh", value)} />
          <PolicyField label="Коэффициент дорожного пути" description="Компенсирует отличие прямого расстояния от реального маршрута" value={policy.eta_road_distance_factor} min={1} max={3} step={0.01} onChange={(value) => setNumber("eta_road_distance_factor", value)} />
        </div>
      )}

      <p className="mt-1 text-sm text-muted-foreground">
        Время прибытия рассчитывается без учёта пробок и не заменяет навигацию или связь с диспетчером.
      </p>
    </SettingsSection>
  );
}

function PolicyField({ label, description, suffix, value, min, max, step = 1, onChange }: { label: string; description: string; suffix?: string; value: number; min: number; max: number; step?: number; onChange: (value: string) => void }) {
  const id = `gps-${label.toLocaleLowerCase("ru-RU").replaceAll(" ", "-")}`;
  return <div className="flex flex-col gap-3 px-4 py-5 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><Label htmlFor={id}>{label}</Label><p className="mt-1 text-sm text-muted-foreground">{description}</p></div><InputGroup className="w-full shadow-none sm:w-48"><InputGroupInput id={id} type="number" value={value} min={min} max={max} step={step} onChange={(event) => onChange(event.target.value)} />{suffix && <InputGroupAddon align="inline-end"><InputGroupText>{suffix}</InputGroupText></InputGroupAddon>}</InputGroup></div>;
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
