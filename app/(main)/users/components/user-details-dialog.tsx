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
import { Switch } from "@/components/ui/switch";
import type { User } from "@/entities/user/model/types";
import { useAlert } from "@/features/alert/alert-store";
import { getUsersErrorMessage } from "../hooks/use-users";
import { getUserFullName, getUserInitials } from "../lib/user-presenters";
import { AccessBadge } from "./users-grid";

type UserDetailsDialogProps = {
  user: User | null;
  roleName?: string;
  onAccessStatusChange: (
    id: User["id"],
    enabled: boolean,
  ) => Promise<User>;
  onOpenChange: (open: boolean) => void;
};

export function UserDetailsDialog({
  user,
  roleName,
  onAccessStatusChange,
  onOpenChange,
}: UserDetailsDialogProps) {
  const showAlert = useAlert();
  const [isUpdatingAccess, setIsUpdatingAccess] = useState(false);

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

  return (
    <Dialog
      open={user !== null}
      onOpenChange={(open) => {
        if (!open && isUpdatingAccess) return;
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
            <DetailsRow
              icon={<ShieldCheck />}
              label="Роль"
              value={roleName ?? "Роль не найдена"}
            />
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
                  disabled={isUpdatingAccess}
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
          Изменение профиля, роли и удаление станут доступны после появления
          соответствующих backend-ручек.
        </p>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isUpdatingAccess}
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
