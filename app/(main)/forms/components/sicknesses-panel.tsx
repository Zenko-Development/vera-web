"use client";

import { useMemo, useState } from "react";
import { HeartPulse, LoaderCircle, Pencil, Plus, Trash2 } from "lucide-react";
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
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Checklist } from "@/entities/checklist/model/types";
import type {
  CreateSicknessRequest,
  Sickness,
  UpdateSicknessRequest,
} from "@/entities/sickness/model/types";
import { useAlert } from "@/features/alert/alert-store";
import { getFormsError } from "../hooks/use-forms";

type Props = {
  sicknesses: Sickness[];
  forms: Checklist[];
  loading: boolean;
  selectedId: string;
  onSelect: (id: string) => void;
  onCreate: (data: CreateSicknessRequest) => Promise<Sickness>;
  onUpdate: (id: string, data: UpdateSicknessRequest) => Promise<Sickness>;
  onRemove: (id: string) => Promise<void>;
};

export function SicknessesPanel({
  sicknesses,
  forms,
  loading,
  selectedId,
  onSelect,
  onCreate,
  onUpdate,
  onRemove,
}: Props) {
  const showAlert = useAlert();
  const [editing, setEditing] = useState<Sickness | "new" | null>(null);
  const [deleting, setDeleting] = useState<Sickness | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const formCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    forms.forEach((form) => {
      counts[form.sickness_id] = (counts[form.sickness_id] ?? 0) + 1;
    });
    return counts;
  }, [forms]);

  const openEditor = (item: Sickness | "new") => {
    setEditing(item);
    setName(item === "new" ? "" : item.name);
    setDescription(item === "new" ? "" : item.description);
    setError(null);
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing || !name.trim()) return;

    const normalizedName = name.trim().toLocaleLowerCase("ru");
    const duplicate = sicknesses.some(
      (item) =>
        item.id !== (editing === "new" ? null : editing.id) &&
        item.name.trim().toLocaleLowerCase("ru") === normalizedName,
    );
    if (duplicate) {
      setError("Заболевание с таким названием уже существует.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const data = { name: name.trim(), description: description.trim() };
      const saved =
        editing === "new"
          ? await onCreate(data)
          : await onUpdate(editing.id, data);
      setEditing(null);
      if (editing === "new") onSelect(saved.id);
      showAlert({
        title: editing === "new" ? "Заболевание создано" : "Заболевание обновлено",
        type: "success",
      });
    } catch (cause) {
      setError(getFormsError(cause));
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
      showAlert({ title: "Заболевание удалено", type: "success" });
    } catch (cause) {
      showAlert({
        title: "Не удалось удалить заболевание",
        description: getFormsError(cause),
        type: "error",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="flex min-h-0 flex-col overflow-hidden py-0">
      <CardHeader className="grid-cols-[1fr_auto] items-center border-b py-3">
        <CardTitle>Заболевания</CardTitle>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label="Добавить заболевание"
          onClick={() => openEditor("new")}
          disabled={loading}
        >
          <Plus />
        </Button>
      </CardHeader>

      <CardContent className="min-h-0 flex-1 overflow-y-auto p-2">
        {loading && sicknesses.length === 0 ? (
          <div className="flex min-h-52 items-center justify-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" /> Загружаем заболевания…
          </div>
        ) : sicknesses.length === 0 ? (
          <button
            type="button"
            className="flex min-h-52 w-full flex-col items-center justify-center rounded-lg border border-dashed p-5 text-center"
            onClick={() => openEditor("new")}
          >
            <HeartPulse className="mb-3 size-7 text-muted-foreground" />
            <span className="font-medium">Добавьте заболевание</span>
            <span className="mt-1 text-xs text-muted-foreground">
              После этого к нему можно будет привязать форму.
            </span>
          </button>
        ) : (
          <div className="space-y-1">
            {sicknesses.map((sickness) => {
              const count = formCounts[sickness.id] ?? 0;
              const active = selectedId === sickness.id;
              return (
                <div
                  key={sickness.id}
                  className={
                    active
                      ? "group flex items-center gap-1 rounded-lg bg-primary/10 p-2"
                      : "group flex items-center gap-1 rounded-lg p-2 hover:bg-muted/60"
                  }
                >
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    onClick={() => onSelect(active ? "all" : sickness.id)}
                    aria-pressed={active}
                  >
                    <span className="block truncate text-sm font-medium">{sickness.name}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {count === 0
                        ? "Нет форм"
                        : `${count} ${count === 1 ? "форма" : count < 5 ? "формы" : "форм"}`}
                    </span>
                    {sickness.description && (
                      <span className="mt-1 block line-clamp-2 text-xs text-muted-foreground">
                        {sickness.description}
                      </span>
                    )}
                  </button>
                  <div className="flex shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`Изменить ${sickness.name}`}
                      onClick={() => openEditor(sickness)}
                      disabled={loading}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`Удалить ${sickness.name}`}
                      title={count > 0 ? "Сначала перенесите или удалите связанные формы" : undefined}
                      disabled={loading || count > 0}
                      onClick={() => setDeleting(sickness)}
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
                {editing === "new" ? "Новое заболевание" : "Изменить заболевание"}
              </DialogTitle>
              <DialogDescription>
                Название будет отображаться в фильтрах и при создании формы.
              </DialogDescription>
            </DialogHeader>
            <FieldGroup className="gap-4">
              <Field className="gap-2">
                <FieldLabel htmlFor="sickness-name">Название</FieldLabel>
                <Input
                  id="sickness-name"
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
                <FieldLabel htmlFor="sickness-description">Описание</FieldLabel>
                <Textarea
                  id="sickness-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  disabled={busy}
                  rows={3}
                />
              </Field>
              {error && <FieldError>{error}</FieldError>}
            </FieldGroup>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditing(null)} disabled={busy}>
                Отмена
              </Button>
              <Button type="submit" disabled={busy || !name.trim()}>
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
            <DialogTitle>Удалить заболевание?</DialogTitle>
            <DialogDescription>
              «{deleting?.name}» будет удалено из справочника. Это действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)} disabled={busy}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={() => void remove()} disabled={busy}>
              {busy && <LoaderCircle className="animate-spin" />} Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
