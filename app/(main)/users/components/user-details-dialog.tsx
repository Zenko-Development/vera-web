"use client";

import { useState } from "react";
import { KeyRound, LoaderCircle, Pencil, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { getRoleDisplayName } from "@/entities/role/lib/role-presenters";
import type { Role } from "@/entities/role/model/types";
import type { UpdateUserRequest, User } from "@/entities/user/model/types";
import { useAlert } from "@/features/alert/alert-store";
import { useUnsavedChanges, useUnsavedNavigation } from "@/features/unsaved-changes/unsaved-changes-provider";
import { getUsersErrorMessage } from "../hooks/use-users";
import { getUserFullName, getUserInitials } from "../lib/user-presenters";
import { AccessBadge } from "./users-grid";

type DialogMode = "details" | "edit" | "password" | "delete";

type UserDetailsDialogProps = {
  open: boolean;
  user: User | null;
  roles: Role[];
  onAccessStatusChange: (id: User["id"], enabled: boolean) => Promise<User>;
  onRoleChange: (id: User["id"], roleId: Role["id"]) => Promise<User>;
  onProfileChange: (id: User["id"], data: UpdateUserRequest) => Promise<User>;
  onPasswordReset: (id: User["id"], password: string) => Promise<void>;
  onDelete: (id: User["id"]) => Promise<void>;
  onOpenChange: (open: boolean) => void;
  onOpenChangeComplete: (open: boolean) => void;
};

export function UserDetailsDialog({
  open,
  user,
  roles,
  onAccessStatusChange,
  onRoleChange,
  onProfileChange,
  onPasswordReset,
  onDelete,
  onOpenChange,
  onOpenChangeComplete,
}: UserDetailsDialogProps) {
  const showAlert = useAlert();
  const { requestNavigation } = useUnsavedNavigation();
  const [mode, setMode] = useState<DialogMode>("details");
  const [busy, setBusy] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const profileHasChanges = Boolean(
    user &&
    (firstName !== user.name_first ||
      middleName !== user.name_middle ||
      lastName !== user.name_last ||
      username !== user.user_name),
  );

  const openEdit = () => {
    if (!user) return;
    setFirstName(user.name_first);
    setMiddleName(user.name_middle);
    setLastName(user.name_last);
    setUsername(user.user_name);
    setMode("edit");
  };

  const handleAccessStatusChange = async (enabled: boolean) => {
    if (!user || enabled === user.acces_status || busy) return;
    setBusy(true);
    try {
      const updatedUser = await onAccessStatusChange(user.id, enabled);
      showAlert({
        title: enabled ? "Доступ включён" : "Доступ отключён",
        description: `${getUserFullName(updatedUser)}: статус доступа обновлён.`,
        type: "success",
      });
    } catch (error) {
      showAlert({ title: "Не удалось изменить доступ", description: getUsersErrorMessage(error), type: "error" });
    } finally {
      setBusy(false);
    }
  };

  const handleRoleChange = async (roleId: string | null) => {
    if (!user || !roleId || roleId === user.role_id || busy) return;
    setBusy(true);
    try {
      const updatedUser = await onRoleChange(user.id, roleId);
      const roleName = roles.find((role) => role.id === updatedUser.role_id)?.name;
      showAlert({
        title: "Роль изменена",
        description: roleName ? getRoleDisplayName(roleName) : "Новая роль назначена.",
        type: "success",
      });
    } catch (error) {
      showAlert({ title: "Не удалось изменить роль", description: getUsersErrorMessage(error), type: "error" });
    } finally {
      setBusy(false);
    }
  };

  const saveProfile = async (): Promise<boolean> => {
    if (!user || !firstName.trim() || !lastName.trim() || !username.trim()) return false;
    setBusy(true);
    try {
      await onProfileChange(user.id, {
        user_name: username.trim(),
        name_first: firstName.trim(),
        name_middle: middleName.trim(),
        name_last: lastName.trim(),
      });
      showAlert({ title: "Данные пользователя обновлены", type: "success" });
      setMode("details");
      return true;
    } catch (error) {
      showAlert({ title: "Не удалось обновить пользователя", description: getUsersErrorMessage(error), type: "error" });
      return false;
    } finally {
      setBusy(false);
    }
  };

  useUnsavedChanges({
    active: mode === "edit" && profileHasChanges,
    onSave: saveProfile,
    onDiscard: () => setMode("details"),
  });

  const resetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    const byteLength = new TextEncoder().encode(password).length;
    if (password.length < 12 || byteLength > 72 || password !== passwordConfirmation) return;
    setBusy(true);
    try {
      await onPasswordReset(user.id, password);
      showAlert({ title: "Пароль изменён", description: "Новый пароль уже можно использовать для входа.", type: "success" });
      setPassword("");
      setPasswordConfirmation("");
      setMode("details");
    } catch (error) {
      showAlert({ title: "Не удалось изменить пароль", description: getUsersErrorMessage(error), type: "error" });
    } finally {
      setBusy(false);
    }
  };

  const deleteUser = async () => {
    if (!user) return;
    setBusy(true);
    try {
      await onDelete(user.id);
      showAlert({ title: "Пользователь удалён", type: "success" });
      onOpenChange(false);
    } catch (error) {
      showAlert({ title: "Не удалось удалить пользователя", description: getUsersErrorMessage(error), type: "error" });
    } finally {
      setBusy(false);
    }
  };

  const closeOrBack = () => {
    if (mode === "edit" && profileHasChanges) {
      requestNavigation(() => setMode("details"));
    } else if (mode === "details") onOpenChange(false);
    else setMode("details");
  };

  const passwordByteLength = new TextEncoder().encode(password).length;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && busy) return;
        if (nextOpen) onOpenChange(true);
        else if (mode === "edit" && profileHasChanges) requestNavigation(() => onOpenChange(false));
        else onOpenChange(false);
      }}
      onOpenChangeComplete={(nextOpen) => {
        if (!nextOpen) {
          setMode("details");
          setPassword("");
          setPasswordConfirmation("");
        }
        onOpenChangeComplete(nextOpen);
      }}
    >
      <DialogContent>
        {mode === "details" && user && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 pr-8">
                <Avatar size="lg"><AvatarFallback>{getUserInitials(user)}</AvatarFallback></Avatar>
                <div className="min-w-0">
                  <DialogTitle className="truncate text-lg">{getUserFullName(user)}</DialogTitle>
                  <DialogDescription className="mt-1">@{user.user_name}</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="divide-y rounded-xl border">
              <DetailsRow icon={<UserRound />} label="Полное имя" value={getUserFullName(user)} />
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="text-muted-foreground [&_svg]:size-4"><ShieldCheck /></span>
                <span className="flex-1 text-sm text-muted-foreground">Роль</span>
                <div className="flex items-center gap-2">
                  {busy && <LoaderCircle className="size-4 animate-spin text-muted-foreground" />}
                  <Select value={user.role_id} onValueChange={(value) => void handleRoleChange(value)} disabled={busy || roles.length === 0}>
                    <SelectTrigger className="w-48 shadow-none" aria-label="Роль пользователя"><SelectValue placeholder="Выберите роль" /></SelectTrigger>
                    <SelectContent align="end"><SelectGroup><SelectLabel>Доступные роли</SelectLabel>{roles.map((role) => <SelectItem key={role.id} value={role.id}>{getRoleDisplayName(role.name)}</SelectItem>)}</SelectGroup></SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="space-y-1"><p className="text-sm text-muted-foreground">Доступ к системе</p><AccessBadge enabled={user.acces_status} /></div>
                <Switch checked={user.acces_status} onCheckedChange={(enabled) => void handleAccessStatusChange(enabled)} disabled={busy} aria-label={user.acces_status ? "Отключить доступ пользователя" : "Включить доступ пользователя"} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Button type="button" variant="outline" onClick={openEdit}><Pencil /> Изменить</Button>
              <Button type="button" variant="outline" onClick={() => setMode("password")}><KeyRound /> Пароль</Button>
              <Button type="button" variant="outline" className="text-destructive hover:text-destructive" onClick={() => setMode("delete")}><Trash2 /> Удалить</Button>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Закрыть</Button></DialogFooter>
          </>
        )}

        {mode === "edit" && (
          <form className="contents" onSubmit={(event) => { event.preventDefault(); void saveProfile(); }}>
            <DialogHeader><DialogTitle>Изменить пользователя</DialogTitle><DialogDescription>Обновите имя сотрудника или данные учётной записи.</DialogDescription></DialogHeader>
            <div className="grid gap-4 sm:grid-cols-2">
              <ProfileField id="edit-last-name" label="Фамилия" value={lastName} onChange={setLastName} disabled={busy} />
              <ProfileField id="edit-first-name" label="Имя" value={firstName} onChange={setFirstName} disabled={busy} />
              <ProfileField id="edit-middle-name" label="Отчество" value={middleName} onChange={setMiddleName} disabled={busy} required={false} />
              <ProfileField id="edit-username" label="Имя пользователя" value={username} onChange={setUsername} disabled={busy} />
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={closeOrBack} disabled={busy}>Назад</Button>{profileHasChanges && <Button type="submit" disabled={busy || !firstName.trim() || !lastName.trim() || !username.trim()}>{busy && <LoaderCircle className="animate-spin" />}Сохранить</Button>}</DialogFooter>
          </form>
        )}

        {mode === "password" && (
          <form className="contents" onSubmit={resetPassword}>
            <DialogHeader><DialogTitle>Новый пароль</DialogTitle><DialogDescription>От 12 символов и не более 72 байт. После сохранения старый пароль перестанет работать.</DialogDescription></DialogHeader>
            <div className="grid gap-4">
              <ProfileField id="new-password" label="Новый пароль" value={password} onChange={setPassword} disabled={busy} type="password" />
              <ProfileField id="new-password-confirmation" label="Повторите пароль" value={passwordConfirmation} onChange={setPasswordConfirmation} disabled={busy} type="password" />
              {password && password.length < 12 && <p className="text-xs text-destructive">Введите не менее 12 символов.</p>}
              {passwordByteLength > 72 && <p className="text-xs text-destructive">Пароль превышает допустимые 72 байта.</p>}
              {passwordConfirmation && password !== passwordConfirmation && <p className="text-xs text-destructive">Пароли не совпадают.</p>}
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={closeOrBack} disabled={busy}>Назад</Button><Button type="submit" disabled={busy || password.length < 12 || password !== passwordConfirmation || passwordByteLength > 72}>{busy && <LoaderCircle className="animate-spin" />}Изменить пароль</Button></DialogFooter>
          </form>
        )}

        {mode === "delete" && (
          <>
            <DialogHeader><DialogTitle>Удалить пользователя?</DialogTitle><DialogDescription>{user ? `${getUserFullName(user)} больше не сможет войти в систему. Это действие нельзя отменить.` : "Пользователь будет удалён."}</DialogDescription></DialogHeader>
            <DialogFooter><Button type="button" variant="outline" onClick={closeOrBack} disabled={busy}>Назад</Button><Button type="button" variant="destructive" onClick={() => void deleteUser()} disabled={busy}>{busy && <LoaderCircle className="animate-spin" />}Удалить</Button></DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DetailsRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="flex items-center gap-3 px-4 py-3"><span className="text-muted-foreground [&_svg]:size-4">{icon}</span><span className="flex-1 text-sm text-muted-foreground">{label}</span><span className="text-sm font-medium">{value}</span></div>;
}

function ProfileField({ id, label, value, onChange, disabled, required = true, type = "text" }: { id: string; label: string; value: string; onChange: (value: string) => void; disabled: boolean; required?: boolean; type?: string }) {
  return <div className="grid gap-2"><Label htmlFor={id}>{label}</Label><Input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} required={required} autoComplete={type === "password" ? "new-password" : undefined} /></div>;
}
