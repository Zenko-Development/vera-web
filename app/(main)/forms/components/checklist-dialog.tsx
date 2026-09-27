"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Checklist, UpdateChecklistRequest } from "@/entities/checklist/model/types";
import type { Sickness } from "@/entities/sickness/model/types";
import { useAlert } from "@/features/alert/alert-store";
import { getFormsError } from "../hooks/use-forms";

type ChecklistDialogProps = {
  open: boolean;
  form?: Checklist | null;
  sicknesses: Sickness[];
  onOpenChange: (open: boolean) => void;
  onOpenChangeComplete?: (open: boolean) => void;
  onSave: (data: UpdateChecklistRequest) => Promise<Checklist>;
};

export function ChecklistDialog({ open, form, sicknesses, onOpenChange, onOpenChangeComplete, onSave }: ChecklistDialogProps) {
  const [name, setName] = useState(form?.name ?? "");
  const [description, setDescription] = useState(form?.description ?? "");
  const [sicknessId, setSicknessId] = useState(form?.sickness_id ?? "");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; sicknessId?: string }>({});
  const alert = useAlert();

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = {
      name: name.trim() ? undefined : "Укажите понятное название формы.",
      sicknessId: sicknessId ? undefined : "Выберите заболевание.",
    };
    setErrors(nextErrors);
    if (nextErrors.name || nextErrors.sicknessId) return;
    setSaving(true);
    try {
      await onSave({ name: name.trim(), description: description.trim(), sickness_id: sicknessId });
      alert({ title: form ? "Форма обновлена" : "Форма создана", type: "success" });
      onOpenChange(false);
    } catch (cause) {
      alert({ title: "Не удалось сохранить форму", description: getFormsError(cause), type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!saving) onOpenChange(next); }} onOpenChangeComplete={onOpenChangeComplete}>
      <DialogContent>
        <form onSubmit={submit} className="contents">
          <DialogHeader>
            <DialogTitle>{form ? "Редактировать форму" : "Новая форма"}</DialogTitle>
            <DialogDescription>Укажите основные данные. После создания сразу откроется редактор содержимого.</DialogDescription>
          </DialogHeader>
          <FieldGroup className="gap-4">
            <Field className="gap-2">
              <FieldLabel htmlFor="form-name">Название формы</FieldLabel>
              <Input id="form-name" value={name} onChange={(event) => { setName(event.target.value); setErrors((current) => ({ ...current, name: undefined })); }} required aria-invalid={Boolean(errors.name)} disabled={saving} autoFocus placeholder="Например, первичная оценка инсульта" />
              <FieldDescription>Название увидит бригада при выборе формы.</FieldDescription>
              {errors.name && <FieldError>{errors.name}</FieldError>}
            </Field>
            <Field className="gap-2">
              <FieldLabel htmlFor="form-description">Описание</FieldLabel>
              <Textarea id="form-description" value={description} onChange={(event) => setDescription(event.target.value)} disabled={saving} />
            </Field>
            <Field className="gap-2">
              <FieldLabel htmlFor="form-sickness">Заболевание</FieldLabel>
              <Select value={sicknessId || null} onValueChange={(value) => { setSicknessId(value ?? ""); setErrors((current) => ({ ...current, sicknessId: undefined })); }} disabled={saving || sicknesses.length === 0}>
                <SelectTrigger id="form-sickness" className="w-full" aria-invalid={Boolean(errors.sicknessId)}><SelectValue placeholder="Выберите заболевание" /></SelectTrigger>
                <SelectContent align="start"><SelectGroup><SelectLabel>Заболевания</SelectLabel>
                  {sicknesses.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
                </SelectGroup></SelectContent>
              </Select>
              <FieldDescription>{sicknesses.length === 0 ? <>Сначала добавьте заболевание в разделе <Link href="/settings?section=catalogs">Настройки → Справочники</Link>.</> : "Заболевание определяет, для какого сценария бригада увидит эту форму."}</FieldDescription>
              {errors.sicknessId && <FieldError>{errors.sicknessId}</FieldError>}
            </Field>
            {!form && <><FieldSeparator>Следующий шаг</FieldSeparator><FieldDescription>После сохранения откроется пошаговый редактор вопросов, правил и маршрутизации.</FieldDescription></>}
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Отмена</Button>
            <Button type="submit" disabled={saving || !name.trim() || !sicknessId}>
              {saving && <LoaderCircle className="animate-spin" />} {form ? "Сохранить" : "Создать и открыть редактор"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
