"use client";

import { useState } from "react";
import { LoaderCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
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
import { Switch } from "@/components/ui/switch";
import type { Role } from "@/entities/role/model/types";
import type { CreateUserRequest, User } from "@/entities/user/model/types";
import { useAlert } from "@/features/alert/alert-store";
import { getUsersErrorMessage } from "../hooks/use-users";
import Link from "next/link";

type UserFormProps = {
  open: boolean;
  roles: Role[];
  onOpenChange: (open: boolean) => void;
  onCreate: (data: CreateUserRequest) => Promise<User>;
};

type FormState = {
  userName: string;
  firstName: string;
  middleName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
  roleId: string;
  accessEnabled: boolean;
};

const emptyForm: FormState = {
  userName: "",
  firstName: "",
  middleName: "",
  lastName: "",
  password: "",
  confirmPassword: "",
  roleId: "",
  accessEnabled: true,
};

export function UserForm({
  open,
  roles,
  onOpenChange,
  onCreate,
}: UserFormProps) {
  const showAlert = useAlert();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>(
    {},
  );
  const [isSaving, setIsSaving] = useState(false);

  const setField = <K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setErrors({});
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isSaving) return;
    if (!nextOpen) resetForm();
    onOpenChange(nextOpen);
  };

  const validate = () => {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};

    if (!form.lastName.trim()) nextErrors.lastName = "Укажите фамилию";
    if (!form.firstName.trim()) nextErrors.firstName = "Укажите имя";
    if (!form.userName.trim()) nextErrors.userName = "Укажите логин";
    if (!form.roleId) nextErrors.roleId = "Выберите роль";
    if (form.password.length < 6) {
      nextErrors.password = "Минимум 6 символов";
    }
    if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = "Пароли не совпадают";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    try {
      const user = await onCreate({
        user_name: form.userName.trim(),
        name_first: form.firstName.trim(),
        name_middle: form.middleName.trim(),
        name_last: form.lastName.trim(),
        acces_status: form.accessEnabled,
        role_id: form.roleId,
        password: form.password,
      });

      showAlert({
        title: "Пользователь создан",
        description: `${user.name_last} ${user.name_first} добавлен в систему.`,
        type: "success",
      });
      resetForm();
      onOpenChange(false);
    } catch (error) {
      showAlert({
        title: "Не удалось создать пользователя",
        description: getUsersErrorMessage(error),
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Drawer
      swipeDirection="right"
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DrawerContent className="m-3 w-full max-w-lg">
        <DrawerHeader className="flex-row items-start justify-between border-b pb-4">
          <div>
            <DrawerTitle className="text-xl">Новый пользователь</DrawerTitle>
            <DrawerDescription className="mt-1">
              Создайте учётную запись и назначьте ей роль.
            </DrawerDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => handleOpenChange(false)}
            disabled={isSaving}
          >
            <X />
            <span className="sr-only">Закрыть</span>
          </Button>
        </DrawerHeader>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div className="min-h-0 flex-1 space-y-7 overflow-y-auto p-4">
            <FormSection title="Личные данные">
              <FormField
                id="lastName"
                label="Фамилия"
                value={form.lastName}
                error={errors.lastName}
                onChange={(value) => setField("lastName", value)}
                disabled={isSaving}
                required
              />
              <FormField
                id="firstName"
                label="Имя"
                value={form.firstName}
                error={errors.firstName}
                onChange={(value) => setField("firstName", value)}
                disabled={isSaving}
                required
              />
              <FormField
                id="middleName"
                label="Отчество"
                value={form.middleName}
                error={errors.middleName}
                onChange={(value) => setField("middleName", value)}
                disabled={isSaving}
              />
            </FormSection>

            <FormSection title="Учётная запись">
              <FormField
                id="userName"
                label="Логин"
                value={form.userName}
                error={errors.userName}
                onChange={(value) => setField("userName", value)}
                disabled={isSaving}
                autoComplete="username"
                required
              />
              <FormField
                id="password"
                label="Пароль"
                type="password"
                value={form.password}
                error={errors.password}
                onChange={(value) => setField("password", value)}
                disabled={isSaving}
                autoComplete="new-password"
                required
              />
              <FormField
                id="confirmPassword"
                label="Повторите пароль"
                type="password"
                value={form.confirmPassword}
                error={errors.confirmPassword}
                onChange={(value) => setField("confirmPassword", value)}
                disabled={isSaving}
                autoComplete="new-password"
                required
              />
            </FormSection>

            <FormSection title="Доступ">
              <div className="grid gap-2">
                <Label htmlFor="role">Роль</Label>
                <Select
                  value={form.roleId || null}
                  onValueChange={(value) => setField("roleId", value ?? "")}
                  disabled={isSaving || roles.length === 0}
                >
                  <SelectTrigger
                    id="role"
                    className="w-full shadow-none"
                    aria-invalid={Boolean(errors.roleId)}
                  >
                    <SelectValue placeholder="Выберите роль" />
                  </SelectTrigger>
                  <SelectContent align="start">
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
                {errors.roleId && (
                  <p className="text-xs text-destructive">{errors.roleId}</p>
                )}
                {roles.length === 0 && (
                  <p className="text-xs">
                    Сначала создайте роль на странице <Link href="/settings " className="text-blue-400">настроек</Link> .
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between gap-4 rounded-xl border p-4">
                <div>
                  <Label htmlFor="accessEnabled">Доступ к системе</Label>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Пользователь сможет войти после создания.
                  </p>
                </div>
                <Switch
                  id="accessEnabled"
                  checked={form.accessEnabled}
                  onCheckedChange={(checked) =>
                    setField("accessEnabled", checked)
                  }
                  disabled={isSaving}
                />
              </div>
            </FormSection>
          </div>

          <DrawerFooter className="border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSaving}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={isSaving || roles.length === 0}
            >
              {isSaving && <LoaderCircle className="animate-spin" />}
              Создать пользователя
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h3 className="font-medium">{title}</h3>
      {children}
    </section>
  );
}

function FormField({
  id,
  label,
  value,
  error,
  onChange,
  type = "text",
  ...props
}: {
  id: string;
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
} & Omit<React.ComponentProps<"input">, "id" | "value" | "onChange">) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        className="shadow-none"
        {...props}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
