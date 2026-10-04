"use client";

import { Children, useState } from "react";
import { LoaderCircle, Plus, Trash2, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { checklistResultEquipmentRequirementApi } from "@/entities/checklist-result-equipment-requirement/api/checklist-result-equipment-requirement.api";
import { checklistResultOperatingRequirementApi } from "@/entities/checklist-result-operating-requirement/api/checklist-result-operating-requirement.api";
import type { ChecklistResult } from "@/entities/checklist-result/model/types";
import type { ChecklistVersion } from "@/entities/checklist-version/model/types";
import { useAlert } from "@/features/alert/alert-store";
import type { FormVersionData } from "../hooks/use-form-version";
import { getFormsError } from "../hooks/use-forms";

type Kind = "equipment" | "operating";
type EditorTarget = { result: ChecklistResult; kind: Kind } | null;

export function ResourceRequirementsEditor({ version, data, onChanged, canManage }: { version: ChecklistVersion; data: FormVersionData; onChanged: () => Promise<void>; canManage: boolean }) {
  const showAlert = useAlert();
  const editable = canManage && version.status === "draft";
  const [target, setTarget] = useState<EditorTarget>(null);
  const [typeId, setTypeId] = useState("");
  const [count, setCount] = useState("1");
  const [busy, setBusy] = useState(false);

  const open = (result: ChecklistResult, kind: Kind) => { setTarget({ result, kind }); setTypeId(""); setCount("1"); };
  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!target || !typeId || Number(count) < 1) return; setBusy(true);
    try {
      if (target.kind === "equipment") await checklistResultEquipmentRequirementApi.create(target.result.id, { equipment_id: typeId, required_count: Number(count) });
      else await checklistResultOperatingRequirementApi.create(target.result.id, { operating_id: typeId, required_count: Number(count) });
      setTarget(null); await onChanged(); showAlert({ title: "Требование добавлено", type: "success" });
    } catch (cause) { showAlert({ title: "Не удалось добавить требование", description: getFormsError(cause), type: "error" }); }
    finally { setBusy(false); }
  };
  const remove = async (kind: Kind, id: string) => {
    setBusy(true);
    try { if (kind === "equipment") await checklistResultEquipmentRequirementApi.delete(id); else await checklistResultOperatingRequirementApi.delete(id); await onChanged(); }
    catch (cause) { showAlert({ title: "Не удалось удалить требование", description: getFormsError(cause), type: "error" }); }
    finally { setBusy(false); }
  };
  const update = async (kind: Kind, id: string, requiredCount: number) => {
    setBusy(true);
    try { if (kind === "equipment") await checklistResultEquipmentRequirementApi.update(id, { required_count: requiredCount }); else await checklistResultOperatingRequirementApi.update(id, { required_count: requiredCount }); await onChanged(); }
    catch (cause) { showAlert({ title: "Не удалось изменить количество", description: getFormsError(cause), type: "error" }); }
    finally { setBusy(false); }
  };

  if (!data.results.length) return <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center"><Wrench className="mb-3 size-7 text-muted-foreground" /><p className="font-medium">Сначала добавьте результаты</p><p className="mt-1 text-sm text-muted-foreground">Требования задаются отдельно для каждого результата.</p></div>;
  return <div className="grid gap-4 xl:grid-cols-2">{data.results.map((result) => {
    const equipment = data.equipmentRequirementsByResult[result.id] ?? [];
    const operating = data.operatingRequirementsByResult[result.id] ?? [];
    return <Card key={result.id} size="sm"><CardHeader><CardTitle>{result.title}</CardTitle><CardDescription>Больница должна одновременно выполнить все требования.</CardDescription></CardHeader><CardContent className="space-y-4"><RequirementGroup title="Оборудование" editable={editable} onAdd={() => open(result, "equipment")}>{equipment.map((item) => <RequirementRow key={item.id} name={data.equipmentTypes.find((type) => type.id === item.equipment_id)?.name ?? "Тип оборудования удалён"} count={item.required_count} editable={editable} busy={busy} onCount={(value) => void update("equipment", item.id, value)} onRemove={() => void remove("equipment", item.id)} />)}</RequirementGroup><RequirementGroup title="Операционные" editable={editable} onAdd={() => open(result, "operating")}>{operating.map((item) => <RequirementRow key={item.id} name={data.operatingTypes.find((type) => type.id === item.operating_id)?.name ?? "Тип операционной удалён"} count={item.required_count} editable={editable} busy={busy} onCount={(value) => void update("operating", item.id, value)} onRemove={() => void remove("operating", item.id)} />)}</RequirementGroup></CardContent></Card>;
  })}
    <Dialog open={target !== null} onOpenChange={(openState) => { if (!openState && !busy) setTarget(null); }}><DialogContent><form className="contents" onSubmit={save}><DialogHeader><DialogTitle>Новое требование</DialogTitle><DialogDescription>{target?.result.title}</DialogDescription></DialogHeader><div className="grid gap-4"><div className="grid gap-2"><Label>Тип ресурса</Label><Select value={typeId || null} onValueChange={(value) => setTypeId(value ?? "")}><SelectTrigger className="w-full"><SelectValue placeholder="Выберите тип" /></SelectTrigger><SelectContent>{(target?.kind === "equipment" ? data.equipmentTypes : data.operatingTypes).map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-2"><Label htmlFor="requirement-count">Необходимое количество</Label><Input id="requirement-count" type="number" min="1" step="1" value={count} onChange={(event) => setCount(event.target.value)} required /></div></div><DialogFooter><Button type="button" variant="outline" onClick={() => setTarget(null)}>Отмена</Button><Button type="submit" disabled={busy || !typeId || Number(count) < 1}>{busy && <LoaderCircle className="animate-spin" />}Добавить</Button></DialogFooter></form></DialogContent></Dialog>
  </div>;
}

function RequirementGroup({ title, editable, onAdd, children }: { title: string; editable: boolean; onAdd: () => void; children: React.ReactNode }) { return <section><div className="mb-2 flex items-center justify-between"><h4 className="text-sm font-medium">{title}</h4>{editable && <Button size="xs" variant="outline" onClick={onAdd}><Plus />Добавить</Button>}</div><div className="divide-y rounded-lg border">{Children.count(children) ? children : <p className="p-3 text-sm text-muted-foreground">Нет требований</p>}</div></section>; }
function RequirementRow({ name, count, editable, busy, onCount, onRemove }: { name: string; count: number; editable: boolean; busy: boolean; onCount: (value: number) => void; onRemove: () => void }) { return <div className="flex items-center gap-2 p-2"><span className="min-w-0 flex-1 truncate text-sm">{name}</span>{editable ? <Input className="h-8 w-20" type="number" min="1" value={count} disabled={busy} onChange={(event) => { const value = Number(event.target.value); if (value >= 1) onCount(value); }} /> : <span className="text-sm">× {count}</span>}{editable && <Button size="icon-sm" variant="ghost" onClick={onRemove} disabled={busy}><Trash2 /></Button>}</div>; }
