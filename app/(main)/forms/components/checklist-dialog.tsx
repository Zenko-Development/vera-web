"use client";

import { useState } from "react";
import { LoaderCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Checklist, UpdateChecklistRequest } from "@/entities/checklist/model/types";
import type { CreateSicknessRequest, Sickness } from "@/entities/sickness/model/types";
import { useAlert } from "@/features/alert/alert-store";
import { getFormsError } from "../hooks/use-forms";

type ChecklistDialogProps = {
  open: boolean;
  form?: Checklist | null;
  sicknesses: Sickness[];
  onCreateSickness: (data: CreateSicknessRequest) => Promise<Sickness>;
  onOpenChange: (open: boolean) => void;
  onSave: (data: UpdateChecklistRequest) => Promise<Checklist>;
};

export function ChecklistDialog({ open, form, sicknesses, onCreateSickness, onOpenChange, onSave }: ChecklistDialogProps) {
  const [name, setName] = useState(form?.name ?? "");
  const [description, setDescription] = useState(form?.description ?? "");
  const [sicknessId, setSicknessId] = useState(form?.sickness_id ?? "");
  const [saving, setSaving] = useState(false);
  const [addingSickness, setAddingSickness] = useState(false);
  const [creatingSickness, setCreatingSickness] = useState(false);
  const [newSicknessName, setNewSicknessName] = useState("");
  const [newSicknessDescription, setNewSicknessDescription] = useState("");
  const [sicknessError, setSicknessError] = useState<string | null>(null);
  const alert = useAlert();

  const createSickness = async () => {
    if (saving || creatingSickness) return;
    const sicknessName = newSicknessName.trim();
    if (!sicknessName) { setSicknessError("Введите название заболевания."); return; }
    if (sicknesses.some((item) => item.name.trim().toLocaleLowerCase("ru") === sicknessName.toLocaleLowerCase("ru"))) {
      setSicknessError("Заболевание с таким названием уже есть в списке. Выберите его выше.");
      return;
    }
    setCreatingSickness(true);
    setSicknessError(null);
    try {
      const created = await onCreateSickness({ name: sicknessName, description: newSicknessDescription.trim() });
      setSicknessId(created.id);
      setNewSicknessName("");
      setNewSicknessDescription("");
      setAddingSickness(false);
      alert({ title: "Заболевание создано и выбрано", type: "success" });
    } catch (cause) {
      setSicknessError(getFormsError(cause));
    } finally {
      setCreatingSickness(false);
    }
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !sicknessId) return;
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
    <Dialog open={open} onOpenChange={(next) => { if (!saving && !creatingSickness) onOpenChange(next); }}>
      <DialogContent>
        <form onSubmit={submit} className="contents">
          <DialogHeader>
            <DialogTitle>{form ? "Редактировать форму" : "Новая форма"}</DialogTitle>
            <DialogDescription>Укажите основные данные. После создания сразу откроется редактор содержимого.</DialogDescription>
          </DialogHeader>
          <FieldGroup className="gap-4">
            <Field className="gap-2">
              <FieldLabel htmlFor="form-name">Название формы</FieldLabel>
              <Input id="form-name" value={name} onChange={(event) => setName(event.target.value)} required disabled={saving || creatingSickness} autoFocus />
            </Field>
            <Field className="gap-2">
              <FieldLabel htmlFor="form-description">Описание</FieldLabel>
              <Textarea id="form-description" value={description} onChange={(event) => setDescription(event.target.value)} disabled={saving || creatingSickness} />
            </Field>
            <Field className="gap-2">
              <FieldLabel htmlFor="form-sickness">Заболевание</FieldLabel>
              <Select value={sicknessId || null} onValueChange={(value) => setSicknessId(value ?? "")} disabled={saving || creatingSickness || sicknesses.length === 0}>
                <SelectTrigger id="form-sickness" className="w-full"><SelectValue placeholder="Выберите заболевание" /></SelectTrigger>
                <SelectContent align="start"><SelectGroup><SelectLabel>Заболевания</SelectLabel>
                  {sicknesses.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
                </SelectGroup></SelectContent>
              </Select>
              <FieldDescription>Заболевание определяет, для какого сценария бригада увидит эту форму.</FieldDescription>
              <Button type="button" variant="link" size="sm" className="h-auto justify-start px-0" disabled={saving || creatingSickness} onClick={() => { setAddingSickness((current) => !current); setSicknessError(null); }} aria-expanded={addingSickness} aria-controls="new-sickness-fields"><Plus /> {addingSickness ? "Скрыть создание заболевания" : "Новое заболевание"}</Button>
              {addingSickness && <FieldGroup id="new-sickness-fields" className="gap-3 rounded-md border bg-muted/30 p-3">
                <Field className="gap-1"><FieldLabel htmlFor="new-sickness-name">Название заболевания</FieldLabel><Input id="new-sickness-name" value={newSicknessName} onChange={(event) => { setNewSicknessName(event.target.value); setSicknessError(null); }} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void createSickness(); } }} disabled={creatingSickness || saving} placeholder="Например, грипп" /></Field>
                <Field className="gap-1"><FieldLabel htmlFor="new-sickness-description">Описание (необязательно)</FieldLabel><Textarea id="new-sickness-description" value={newSicknessDescription} onChange={(event) => setNewSicknessDescription(event.target.value)} disabled={creatingSickness || saving} rows={2} /></Field>
                {sicknessError && <FieldError>{sicknessError}</FieldError>}
                <Button type="button" variant="outline" size="sm" className="justify-self-start" onClick={createSickness} disabled={creatingSickness || saving || !newSicknessName.trim()}>{creatingSickness && <LoaderCircle className="animate-spin" />} Создать и выбрать</Button>
              </FieldGroup>}
            </Field>
            {!form && <><FieldSeparator>Следующий шаг</FieldSeparator><FieldDescription>После сохранения откроется пошаговый редактор вопросов, правил и маршрутизации.</FieldDescription></>}
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving || creatingSickness}>Отмена</Button>
            <Button type="submit" disabled={saving || creatingSickness || !name.trim() || !sicknessId}>
              {saving && <LoaderCircle className="animate-spin" />} {form ? "Сохранить" : "Создать"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
