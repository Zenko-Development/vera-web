"use client";

import { useMemo, useState } from "react";
import { Building2, LoaderCircle, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type {
  CreateFacilityTypeRequest,
  FacilityType,
  UpdateFacilityTypeRequest,
} from "@/entities/facility-type/model/types";
import type { Hospital } from "@/entities/hospital/model/types";
import { useAlert } from "@/features/alert/alert-store";
import { getHospitalsErrorMessage } from "../hooks/use-hospitals";

type Props = {
  facilityTypes: FacilityType[];
  hospitals: Hospital[];
  loading: boolean;
  selectedId: string;
  onSelect: (id: string) => void;
  onCreate: (data: CreateFacilityTypeRequest) => Promise<FacilityType>;
  onUpdate: (
    id: string,
    data: UpdateFacilityTypeRequest,
  ) => Promise<FacilityType>;
  onRemove: (id: string) => Promise<void>;
};

export function FacilityTypesPanel({
  facilityTypes,
  hospitals,
  loading,
  selectedId,
  onSelect,
  onCreate,
  onUpdate,
  onRemove,
}: Props) {
  const showAlert = useAlert();
  const [editing, setEditing] = useState<FacilityType | "new" | null>(null);
  const [deleting, setDeleting] = useState<FacilityType | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const hospitalCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    hospitals.forEach((hospital) => {
      counts[hospital.facility_type_id] =
        (counts[hospital.facility_type_id] ?? 0) + 1;
    });
    return counts;
  }, [hospitals]);

  const openEditor = (item: FacilityType | "new") => {
    setEditing(item);
    setName(item === "new" ? "" : item.name);
    setCode(item === "new" ? "" : item.code);
    setDescription(item === "new" ? "" : item.description);
    setError(null);
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing || !name.trim() || !code.trim()) return;

    const currentId = editing === "new" ? null : editing.id;
    const normalizedName = name.trim().toLocaleLowerCase("ru");
    const normalizedCode = code.trim().toLocaleLowerCase("en");
    const duplicateName = facilityTypes.some(
      (item) =>
        item.id !== currentId &&
        item.name.trim().toLocaleLowerCase("ru") === normalizedName,
    );
    const duplicateCode = facilityTypes.some(
      (item) =>
        item.id !== currentId &&
        item.code.trim().toLocaleLowerCase("en") === normalizedCode,
    );

    if (duplicateName || duplicateCode) {
      setError(
        duplicateName
          ? "Тип с таким названием уже существует."
          : "Тип с таким кодом уже существует.",
      );
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const data = {
        name: name.trim(),
        code: code.trim(),
        description: description.trim(),
      };
      const saved =
        editing === "new"
          ? await onCreate(data)
          : await onUpdate(editing.id, data);
      setEditing(null);
      if (editing === "new") onSelect(saved.id);
      showAlert({
        title:
          editing === "new"
            ? "Тип учреждения создан"
            : "Тип учреждения обновлён",
        type: "success",
      });
    } catch (cause) {
      setError(getHospitalsErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await onRemove(deleting.id);
      if (selectedId === deleting.id) onSelect("all");
      setDeleting(null);
      showAlert({ title: "Тип учреждения удалён", type: "success" });
    } catch (cause) {
      showAlert({
        title: "Не удалось удалить тип учреждения",
        description: getHospitalsErrorMessage(cause),
        type: "error",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="flex min-h-0 flex-col overflow-hidden py-0">
      <CardHeader className="grid-cols-[1fr_auto] items-center border-b py-3">
        <CardTitle>Типы учреждений</CardTitle>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label="Добавить тип учреждения"
          onClick={() => openEditor("new")}
          disabled={loading}
        >
          <Plus />
        </Button>
      </CardHeader>

      <CardContent className="min-h-0 flex-1 overflow-y-auto p-2">
        {loading && facilityTypes.length === 0 ? (
          <div className="flex min-h-52 items-center justify-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" /> Загружаем типы…
          </div>
        ) : facilityTypes.length === 0 ? (
          <button
            type="button"
            className="flex min-h-52 w-full flex-col items-center justify-center rounded-lg border border-dashed p-5 text-center"
            onClick={() => openEditor("new")}
          >
            <Building2 className="mb-3 size-7 text-muted-foreground" />
            <span className="font-medium">Добавьте тип учреждения</span>
            <span className="mt-1 text-xs text-muted-foreground">
              После этого можно будет создать сосудистый центр.
            </span>
          </button>
        ) : (
          <div className="space-y-1">
            {facilityTypes.map((facilityType) => {
              const count = hospitalCounts[facilityType.id] ?? 0;
              const active = selectedId === facilityType.id;
              return (
                <div
                  key={facilityType.id}
                  className={
                    active
                      ? "group flex items-center gap-1 rounded-lg bg-primary/10 p-2"
                      : "group flex items-center gap-1 rounded-lg p-2 hover:bg-muted/60"
                  }
                >
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    onClick={() => onSelect(active ? "all" : facilityType.id)}
                    aria-pressed={active}
                  >
                    <span className="block truncate text-sm font-medium">
                      {facilityType.name}
                    </span>
                    <span className="mt-0.5 block truncate font-mono text-xs text-muted-foreground">
                      {facilityType.code}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {formatHospitalCount(count)}
                    </span>
                    {facilityType.description && (
                      <span className="mt-1 block line-clamp-2 text-xs text-muted-foreground">
                        {facilityType.description}
                      </span>
                    )}
                  </button>
                  <div className="flex shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`Изменить ${facilityType.name}`}
                      onClick={() => openEditor(facilityType)}
                      disabled={loading}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`Удалить ${facilityType.name}`}
                      title={
                        count > 0
                          ? "Сначала перенесите или удалите связанные центры"
                          : undefined
                      }
                      disabled={loading || count > 0}
                      onClick={() => setDeleting(facilityType)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open && !busy) setEditing(null);
        }}
      >
        <DialogContent>
          <form className="contents" onSubmit={save}>
            <DialogHeader>
              <DialogTitle>
                {editing === "new"
                  ? "Новый тип учреждения"
                  : "Изменить тип учреждения"}
              </DialogTitle>
              <DialogDescription>
                Тип используется в фильтрах центров и правилах маршрутизации.
              </DialogDescription>
            </DialogHeader>
            <FieldGroup className="gap-4">
              <Field className="gap-2">
                <FieldLabel htmlFor="facility-type-name">Название</FieldLabel>
                <Input
                  id="facility-type-name"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setError(null);
                  }}
                  disabled={busy}
                  autoFocus
                  required
                />
              </Field>
              <Field className="gap-2">
                <FieldLabel htmlFor="facility-type-code">Код</FieldLabel>
                <Input
                  id="facility-type-code"
                  value={code}
                  onChange={(event) => {
                    setCode(event.target.value);
                    setError(null);
                  }}
                  disabled={busy}
                  required
                  placeholder="vascular_center"
                />
                <FieldDescription>
                  Стабильный технический идентификатор для API и маршрутизации.
                </FieldDescription>
              </Field>
              <Field className="gap-2">
                <FieldLabel htmlFor="facility-type-description">Описание</FieldLabel>
                <Textarea
                  id="facility-type-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  disabled={busy}
                  rows={3}
                />
              </Field>
              {error && <FieldError>{error}</FieldError>}
            </FieldGroup>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditing(null)}
                disabled={busy}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                disabled={busy || !name.trim() || !code.trim()}
              >
                {busy && <LoaderCircle className="animate-spin" />} Сохранить
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open && !busy) setDeleting(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить тип учреждения?</DialogTitle>
            <DialogDescription>
              «{deleting?.name}» будет удалён из справочника. Это действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleting(null)}
              disabled={busy}
            >
              Отмена
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void remove()}
              disabled={busy}
            >
              {busy && <LoaderCircle className="animate-spin" />} Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function formatHospitalCount(count: number): string {
  if (count === 0) return "Нет центров";
  const mod100 = count % 100;
  const mod10 = count % 10;
  if (mod100 >= 11 && mod100 <= 14) return `${count} центров`;
  if (mod10 === 1) return `${count} центр`;
  if (mod10 >= 2 && mod10 <= 4) return `${count} центра`;
  return `${count} центров`;
}
