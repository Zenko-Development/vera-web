"use client";

import { useState } from "react";
import { LoaderCircle, ShieldCheck, UserRound } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { Role } from "@/entities/role/model/types";
import type { User } from "@/entities/user/model/types";
import { useAlert } from "@/features/alert/alert-store";
import { getUsersErrorMessage } from "../hooks/use-users";
import { getUserFullName, getUserInitials } from "../lib/user-presenters";
import { AccessBadge } from "./users-grid";

type UserDetailsDialogProps = {
  user: User | null;
  roles: Role[];
  onAccessStatusChange: (
    id: User["id"],
    enabled: boolean,
  ) => Promise<User>;
  onRoleChange: (id: User["id"], roleId: Role["id"]) => Promise<User>;
  onOpenChange: (open: boolean) => void;
};

export function UserDetailsDialog({
  user,
  roles,
  onAccessStatusChange,
  onRoleChange,
  onOpenChange,
}: UserDetailsDialogProps) {
  const showAlert = useAlert();
  const [isUpdatingAccess, setIsUpdatingAccess] = useState(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  const handleAccessStatusChange = async (enabled: boolean) => {
    if (!user || enabled === user.acces_status || isUpdatingAccess) return;

    setIsUpdatingAccess(true);
    try {
      const updatedUser = await onAccessStatusChange(user.id, enabled);
      showAlert({
        title: enabled ? "Доступ включён" : "Доступ отключён",
        description: `${getUserFullName(updatedUser)}: статус доступа обновлён.`,
        type: "success",
      });
    } catch (error) {
      showAlert({
        title: "Не удалось изменить доступ",
        description: getUsersErrorMessage(error),
        type: "error",
      });
    } finally {
      setIsUpdatingAccess(false);
    }
  };

  const handleRoleChange = async (roleId: string | null) => {
    if (!user || !roleId || roleId === user.role_id || isUpdatingRole) return;

    setIsUpdatingRole(true);
    try {
      const updatedUser = await onRoleChange(user.id, roleId);
      const roleName = roles.find(
        (role) => role.id === updatedUser.role_id,
      )?.name;
      showAlert({
        title: "Роль изменена",
        description: `${getUserFullName(updatedUser)}: ${roleName ?? "новая роль назначена"}.`,
        type: "success",
      });
    } catch (error) {
      showAlert({
        title: "Не удалось изменить роль",
        description: getUsersErrorMessage(error),
        type: "error",
      });
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const isUpdating = isUpdatingAccess || isUpdatingRole;

  return (
    <Dialog
      open={user !== null}
      onOpenChange={(open) => {
        if (!open && isUpdating) return;
        onOpenChange(open);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3 pr-8">
            <Avatar size="lg">
              <AvatarFallback>
                {user ? getUserInitials(user) : "?"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <DialogTitle className="truncate text-lg">
                {user ? getUserFullName(user) : "Пользователь"}
              </DialogTitle>
              <DialogDescription className="mt-1">
                @{user?.user_name}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {user && (
          <div className="divide-y rounded-xl border">
            <DetailsRow
              icon={<UserRound />}
              label="Полное имя"
              value={getUserFullName(user)}
            />
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="text-muted-foreground [&_svg]:size-4">
                <ShieldCheck />
              </span>
              <span className="flex-1 text-sm text-muted-foreground">Роль</span>
              <div className="flex items-center gap-2">
                {isUpdatingRole && (
                  <LoaderCircle className="size-4 animate-spin text-muted-foreground" />
                )}
                <Select
                  value={user.role_id}
                  onValueChange={(value) => void handleRoleChange(value)}
                  disabled={isUpdating || roles.length === 0}
                >
                  <SelectTrigger
                    className="w-48 shadow-none"
                    aria-label="Роль пользователя"
                  >
                    <SelectValue placeholder="Выберите роль" />
                  </SelectTrigger>
                  <SelectContent align="end">
                    <SelectGroup>
                      <SelectLabel>Доступные роли</SelectLabel>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Доступ к системе
                </p>
                <AccessBadge enabled={user.acces_status} />
              </div>
              <div className="flex items-center gap-2">
                {isUpdatingAccess && (
                  <LoaderCircle className="size-4 animate-spin text-muted-foreground" />
                )}
                <Switch
                  checked={user.acces_status}
                  onCheckedChange={(enabled) =>
                    void handleAccessStatusChange(enabled)
                  }
                  disabled={isUpdating}
                  aria-label={
                    user.acces_status
                      ? "Отключить доступ пользователя"
                      : "Включить доступ пользователя"
                  }
                />
              </div>
            </div>
            <div className="px-4 py-3">
              <p className="text-sm text-muted-foreground">ID пользователя</p>
              <p className="mt-1 break-all font-mono text-xs">{user.id}</p>
            </div>
          </div>
        )}

        <p className="text-xs leading-relaxed text-muted-foreground">
          Изменение профиля и удаление станут доступны после появления
          соответствующих backend-ручек. Роль и доступ можно менять здесь.
        </p>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isUpdating}
          >
            Закрыть
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DetailsRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="text-muted-foreground [&_svg]:size-4">{icon}</span>
      <span className="flex-1 text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
