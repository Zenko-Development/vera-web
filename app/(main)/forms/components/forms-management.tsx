"use client";

import { useEffect, useMemo, useState } from "react";
import { ClipboardList, LoaderCircle, Plus, RefreshCw, Search, Settings2, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Checklist } from "@/entities/checklist/model/types";
import { useAlert } from "@/features/alert/alert-store";
import { getFormsError, useForms } from "../hooks/use-forms";
import { ChecklistDialog } from "./checklist-dialog";
import { FormWorkspace } from "./form-workspace";

export function FormsManagement() {
  const showAlert = useAlert();
  const {
    forms,
    sicknesses,
    loading,
    error,
    refresh,
    create,
    update,
    remove,
  } = useForms();
  const [query, setQuery] = useState("");
  const [sicknessFilter, setSicknessFilter] = useState("all");
  const [createDialogMounted, setCreateDialogMounted] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [deleting, setDeleting] = useState<Checklist | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const sicknessNames = useMemo(
    () => Object.fromEntries(sicknesses.map((item) => [item.id, item.name])),
    [sicknesses],
  );
  const selected = selectedId ? forms.find((form) => form.id === selectedId) ?? null : null;

  useEffect(() => {
    if (!createDialogMounted) return;

    const animationFrame = window.requestAnimationFrame(() => {
      setCreateDialogOpen(true);
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [createDialogMounted]);

  useEffect(() => {
    if (!selectedId) return;

    const animationFrame = window.requestAnimationFrame(() => {
      setWorkspaceOpen(true);
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [selectedId]);

  const openCreateDialog = () => {
    setCreateDialogOpen(false);
    setCreateDialogMounted(true);
  };

  const openWorkspace = (id: string) => {
    setWorkspaceOpen(false);
    setSelectedId(id);
  };
  const visible = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ru");
    return forms
      .filter((form) => {
        const matchesSickness = sicknessFilter === "all" || form.sickness_id === sicknessFilter;
        const searchValue = `${form.name} ${form.description} ${sicknessNames[form.sickness_id] ?? ""}`.toLocaleLowerCase("ru");
        return matchesSickness && (!normalizedQuery || searchValue.includes(normalizedQuery));
      })
      .sort((left, right) => left.name.localeCompare(right.name, "ru"));
  }, [forms, query, sicknessFilter, sicknessNames]);

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await remove(deleting.id);
      if (selectedId === deleting.id) setSelectedId(null);
      setDeleting(null);
      showAlert({ title: "Форма удалена", type: "success" });
    } catch (cause) {
      showAlert({ title: "Не удалось удалить форму", description: getFormsError(cause), type: "error" });
    } finally { setDeleteBusy(false); }
  };

  const handleRefresh = async () => {
    try { await refresh(); }
    catch (cause) { showAlert({ title: "Не удалось обновить формы", description: getFormsError(cause), type: "error" }); }
  };

  return <div className="flex min-h-0 flex-1 flex-col gap-3 pt-3">
    <Card size="sm"><CardContent className="flex flex-row flex-wrap items-center gap-2">
      <InputGroup className="min-w-64 flex-1 shadow-none"><InputGroupAddon><Search /></InputGroupAddon><InputGroupInput value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск по названию, описанию или заболеванию" aria-label="Поиск форм" /></InputGroup>
      <Select value={sicknessFilter} onValueChange={(value) => setSicknessFilter(value ?? "all")}><SelectTrigger className="w-52 bg-background shadow-none" size="sm" aria-label="Фильтр по заболеванию"><SelectValue /></SelectTrigger><SelectContent align="start"><SelectGroup><SelectLabel>Заболевание</SelectLabel><SelectItem value="all">Все заболевания</SelectItem>{sicknesses.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectGroup></SelectContent></Select>
      <Button type="button" variant="outline" size="sm" onClick={() => void handleRefresh()} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""} /> Обновить</Button>
      <Button type="button" size="sm" onClick={openCreateDialog}><Plus /> Создать форму</Button>
    </CardContent></Card>

    {error && !loading && <Alert variant="destructive"><AlertTitle>Не удалось загрузить формы</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

    <div className="min-h-0 flex-1 overflow-y-auto pb-5">
        {loading ? <div className="flex h-48 items-center justify-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" /> Загружаем формы…</div>
          : visible.length === 0 ? <div className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-dashed bg-card p-6 text-center text-card-foreground"><ClipboardList className="mb-3 size-8 text-muted-foreground" /><p className="font-medium">{forms.length ? "Формы не найдены" : "Форм пока нет"}</p><p className="mt-1 max-w-sm text-sm text-muted-foreground">{forms.length ? "Измените поиск или выберите другое заболевание." : "Создайте форму и сразу настройте её полный сценарий."}</p>{forms.length === 0 && <Button className="mt-4" size="sm" onClick={openCreateDialog}><Plus /> Создать форму</Button>}</div>
          : <Card className="overflow-hidden py-0"><Table><TableHeader><TableRow><TableHead>Форма</TableHead><TableHead>Заболевание</TableHead><TableHead>Обновлена</TableHead><TableHead className="w-56">Действия</TableHead></TableRow></TableHeader><TableBody>{visible.map((form) => <TableRow key={form.id}>
            <TableCell><button type="button" className="text-left" onClick={() => openWorkspace(form.id)}><span className="font-medium hover:underline">{form.name}</span><span className="mt-1 block max-w-lg truncate text-xs text-muted-foreground">{form.description || "Без описания"}</span></button></TableCell>
            <TableCell>{sicknessNames[form.sickness_id] ?? "Неизвестное заболевание"}</TableCell>
            <TableCell className="text-muted-foreground">{form.updated_at ? new Date(form.updated_at).toLocaleDateString("ru-RU") : "—"}</TableCell>
            <TableCell><div className="flex items-center gap-1"><Button type="button" size="sm" variant="outline" onClick={() => openWorkspace(form.id)}><Settings2 /> Открыть</Button><Button type="button" size="icon-sm" variant="ghost" aria-label={`Удалить ${form.name}`} onClick={() => setDeleting(form)}><Trash2 /></Button></div></TableCell>
          </TableRow>)}</TableBody></Table></Card>}
    </div>

    {selected && <FormWorkspace
      key={selected.id}
      open={workspaceOpen}
      form={selected}
      sicknessName={sicknessNames[selected.sickness_id] ?? "Неизвестное заболевание"}
      onUpdateMetadata={async (data) => {
        await update(selected.id, { ...data, sickness_id: selected.sickness_id });
      }}
      onOpenChange={setWorkspaceOpen}
      onCloseComplete={() => setSelectedId(null)}
    />}
    {createDialogMounted && <ChecklistDialog
      key="new"
      open={createDialogOpen}
      form={null}
      sicknesses={sicknesses}
      onOpenChange={setCreateDialogOpen}
      onOpenChangeComplete={(open) => {
        if (!open) setCreateDialogMounted(false);
      }}
      onSave={async (data) => {
        const saved = await create(data);
        openWorkspace(saved.id);
        return saved;
      }}
    />}
    <Dialog open={deleting !== null} onOpenChange={(open) => { if (!open && !deleteBusy) setDeleting(null); }}><DialogContent><DialogHeader><DialogTitle>Удалить форму?</DialogTitle><DialogDescription>Форма «{deleting?.name}» и вся история её редакций будут удалены без возможности восстановления.</DialogDescription></DialogHeader><DialogFooter><Button type="button" variant="outline" onClick={() => setDeleting(null)} disabled={deleteBusy}>Отмена</Button><Button type="button" variant="destructive" onClick={() => void confirmDelete()} disabled={deleteBusy}>{deleteBusy && <LoaderCircle className="animate-spin" />} Удалить</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}
