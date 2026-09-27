"use client";

import { useState } from "react";
import { LoaderCircle, MapPin, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { checklistResultRoutingApi } from "@/entities/checklist-result-routing/api/checklist-result-routing.api";
import type { ChecklistResultRoutingRequest, ChecklistResultRoutingType } from "@/entities/checklist-result-routing/model/types";
import type { ChecklistResult } from "@/entities/checklist-result/model/types";
import type { ChecklistVersion } from "@/entities/checklist-version/model/types";
import { useAlert } from "@/features/alert/alert-store";
import type { FormVersionData } from "../hooks/use-form-version";
import { getFormsError } from "../hooks/use-forms";

const routingNames: Record<ChecklistResultRoutingType, string> = {
  fixed: "Конкретная больница",
  by_tag: "Выбор по типу учреждения",
  by_service_area: "По зоне обслуживания",
};

type Props = { version: ChecklistVersion; data: FormVersionData; onChanged: () => Promise<void> };

export function RoutingEditor({ version, data, onChanged }: Props) {
  const showAlert = useAlert();
  const editable = version.status === "draft";
  const [editingResult, setEditingResult] = useState<ChecklistResult | null>(null);
  const [routingType, setRoutingType] = useState<ChecklistResultRoutingType>("fixed");
  const [hospitalId, setHospitalId] = useState("");
  const [facilityTypeId, setFacilityTypeId] = useState("");
  const [deleteResult, setDeleteResult] = useState<ChecklistResult | null>(null);
  const [busy, setBusy] = useState(false);

  const openEditor = (result: ChecklistResult) => {
    const routing = data.routingByResult[result.id];
    setEditingResult(result);
    setRoutingType(routing?.routing_type ?? "fixed");
    setHospitalId(routing?.routing_type === "fixed" ? routing.hospital_id : "");
    setFacilityTypeId(routing?.routing_type === "by_tag" ? routing.facility_type_id : "");
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingResult) return;
    let request: ChecklistResultRoutingRequest;
    if (routingType === "fixed") {
      if (!hospitalId) return;
      request = { routing_type: "fixed", hospital_id: hospitalId };
    } else if (routingType === "by_tag") {
      if (!facilityTypeId) return;
      request = { routing_type: "by_tag", facility_type_id: facilityTypeId };
    } else {
      request = { routing_type: "by_service_area" };
    }

    setBusy(true);
    try {
      const current = data.routingByResult[editingResult.id];
      if (current) await checklistResultRoutingApi.update(current.id, request);
      else await checklistResultRoutingApi.create(editingResult.id, request);
      setEditingResult(null);
      await onChanged();
      showAlert({ title: "Маршрутизация сохранена", type: "success" });
    } catch (cause) {
      showAlert({ title: "Не удалось сохранить маршрутизацию", description: getFormsError(cause), type: "error" });
    } finally { setBusy(false); }
  };

  const remove = async () => {
    if (!deleteResult) return;
    const routing = data.routingByResult[deleteResult.id];
    if (!routing) return;
    setBusy(true);
    try {
      await checklistResultRoutingApi.delete(routing.id);
      setDeleteResult(null);
      await onChanged();
      showAlert({ title: "Маршрутизация удалена", type: "success" });
    } catch (cause) {
      showAlert({ title: "Не удалось удалить маршрутизацию", description: getFormsError(cause), type: "error" });
    } finally { setBusy(false); }
  };

  if (data.results.length === 0) {
    return <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center"><MapPin className="mb-3 size-7 text-muted-foreground" /><p className="font-medium">Сначала добавьте результаты</p><p className="mt-1 max-w-md text-sm text-muted-foreground">Маршрутизация настраивается отдельно для каждого возможного результата формы.</p></div>;
  }

  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    {data.results.map((result) => {
      const routing = data.routingByResult[result.id];
      return <Card key={result.id} size="sm">
        <CardHeader><CardTitle>{result.title || "Без названия"}</CardTitle><CardDescription>{routing ? routingNames[routing.routing_type] : "Маршрутизация не настроена"}</CardDescription></CardHeader>
        <CardContent>
          {routing?.routing_type === "fixed" && <p className="text-sm">{data.hospitals.find((hospital) => hospital.id === routing.hospital_id)?.name ?? "Больница не найдена"}</p>}
          {routing?.routing_type === "by_tag" && <p className="text-sm">{data.facilityTypes.find((type) => type.id === routing.facility_type_id)?.name ?? "Тип учреждения не найден"}</p>}
          {routing?.routing_type === "by_service_area" && <p className="text-sm text-muted-foreground">Больница определяется по свежей геопозиции и активной зоне.</p>}
          {editable && <div className="mt-2 flex gap-2"><Button size="sm" variant="outline" onClick={() => openEditor(result)}><Pencil /> {routing ? "Изменить" : "Настроить"}</Button>{routing && <Button size="icon-sm" variant="ghost" aria-label="Удалить маршрутизацию" onClick={() => setDeleteResult(result)}><Trash2 /></Button>}</div>}
        </CardContent>
      </Card>;
    })}

    <Dialog open={editingResult !== null} onOpenChange={(open) => { if (!open && !busy) setEditingResult(null); }}><DialogContent><form className="contents" onSubmit={save}><DialogHeader><DialogTitle>Маршрутизация результата</DialogTitle><DialogDescription>{editingResult?.title}. Выберите, как определить больницу для бригады.</DialogDescription></DialogHeader><FieldGroup className="gap-4">
      <Field className="gap-2"><FieldLabel htmlFor="routing-type">Способ маршрутизации</FieldLabel><Select value={routingType} onValueChange={(value) => { setRoutingType(value as ChecklistResultRoutingType); setHospitalId(""); setFacilityTypeId(""); }} disabled={busy}><SelectTrigger id="routing-type" className="w-full"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(routingNames).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></Field>
      {routingType === "fixed" && <Field className="gap-2"><FieldLabel htmlFor="routing-hospital">Больница</FieldLabel><Select value={hospitalId || null} onValueChange={(value) => setHospitalId(value ?? "")} disabled={busy}><SelectTrigger id="routing-hospital" className="w-full"><SelectValue placeholder="Выберите больницу" /></SelectTrigger><SelectContent>{data.hospitals.map((hospital) => <SelectItem key={hospital.id} value={hospital.id}>{hospital.name}</SelectItem>)}</SelectContent></Select></Field>}
      {routingType === "by_tag" && <Field className="gap-2"><FieldLabel htmlFor="routing-facility">Тип учреждения</FieldLabel><Select value={facilityTypeId || null} onValueChange={(value) => setFacilityTypeId(value ?? "")} disabled={busy}><SelectTrigger id="routing-facility" className="w-full"><SelectValue placeholder="Выберите тип" /></SelectTrigger><SelectContent>{data.facilityTypes.map((type) => <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>)}</SelectContent></Select><FieldDescription>Бригада выберет одну больницу из найденных кандидатов.</FieldDescription></Field>}
      {routingType === "by_service_area" && <FieldDescription>Сервер выберет больницу по активной зоне с наибольшим приоритетом.</FieldDescription>}
    </FieldGroup><DialogFooter><Button type="button" variant="outline" onClick={() => setEditingResult(null)} disabled={busy}>Отмена</Button><Button type="submit" disabled={busy || (routingType === "fixed" && !hospitalId) || (routingType === "by_tag" && !facilityTypeId)}>{busy && <LoaderCircle className="animate-spin" />} Сохранить</Button></DialogFooter></form></DialogContent></Dialog>
    <Dialog open={deleteResult !== null} onOpenChange={(open) => { if (!open && !busy) setDeleteResult(null); }}><DialogContent><DialogHeader><DialogTitle>Удалить маршрутизацию?</DialogTitle><DialogDescription>Для результата «{deleteResult?.title}» больше не будет задан способ выбора больницы.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDeleteResult(null)} disabled={busy}>Отмена</Button><Button variant="destructive" onClick={() => void remove()} disabled={busy}>{busy && <LoaderCircle className="animate-spin" />} Удалить</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}
