"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BedDouble,
  Building2,
  HeartPulse,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Stethoscope,
  Trash2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { equipmentApi } from "@/entities/equipment/api/equipment.api";
import type { Equipment } from "@/entities/equipment/model/types";
import { facilityTypeApi } from "@/entities/facility-type/api/facility-type.api";
import type { FacilityType } from "@/entities/facility-type/model/types";
import { operatingTypeApi } from "@/entities/operating-type/api/operating-type.api";
import type { OperatingType } from "@/entities/operating-type/model/types";
import { sicknessApi } from "@/entities/sickness/api/sickness.api";
import type { Sickness } from "@/entities/sickness/model/types";
import { useAlert } from "@/features/alert/alert-store";
import { ApiError } from "@/shared/api/types";
import { SettingsSection, SettingsSectionHeader } from "./settings-section";

type CatalogKind = "sicknesses" | "facilityTypes" | "equipment" | "operatingTypes";
type CatalogItem = Sickness | FacilityType | Equipment | OperatingType;
type CatalogState = Record<CatalogKind, CatalogItem[]>;

const catalogMeta: Record<CatalogKind, { title: string; itemName: string; description: string; icon: LucideIcon }> = {
  sicknesses: { title: "Заболевания", itemName: "заболевание", description: "Используются в формах и направлениях центров", icon: HeartPulse },
  facilityTypes: { title: "Типы учреждений", itemName: "тип учреждения", description: "Классификация сосудистых центров", icon: Building2 },
  equipment: { title: "Типы оборудования", itemName: "тип оборудования", description: "Справочник физических ресурсов центров", icon: Stethoscope },
  operatingTypes: { title: "Типы операционных", itemName: "тип операционной", description: "Справочник операционных и кабинетов", icon: BedDouble },
};

const catalogKinds = Object.keys(catalogMeta) as CatalogKind[];

const emptyCatalogs: CatalogState = {
  sicknesses: [],
  facilityTypes: [],
  equipment: [],
  operatingTypes: [],
};

function message(error: unknown): string {
  if (ApiError.isApiError(error)) return error.getMessage();
  return error instanceof Error ? error.message : "Неизвестная ошибка";
}

export function CatalogsSettings() {
  const showAlert = useAlert();
  const [kind, setKind] = useState<CatalogKind>("sicknesses");
  const [catalogs, setCatalogs] = useState<CatalogState>(emptyCatalogs);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<CatalogItem | "new" | null>(null);
  const [deleting, setDeleting] = useState<CatalogItem | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sicknesses, facilityTypes, equipment, operatingTypes] = await Promise.all([
        sicknessApi.list(),
        facilityTypeApi.list(),
        equipmentApi.list(),
        operatingTypeApi.list(),
      ]);
      setCatalogs({ sicknesses, facilityTypes: facilityTypes ?? [], equipment, operatingTypes });
      setError(null);
    } catch (cause) {
      setError(message(cause));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const visibleCatalogs = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("ru-RU");
    return Object.fromEntries(
      catalogKinds.map((itemKind) => [
        itemKind,
        catalogs[itemKind].filter((item) => {
          const value = `${item.name} ${item.description} ${"code" in item ? item.code : ""}`.toLocaleLowerCase("ru-RU");
          return !normalized || value.includes(normalized);
        }),
      ]),
    ) as CatalogState;
  }, [catalogs, query]);

  const openEditor = (itemKind: CatalogKind, item: CatalogItem | "new") => {
    setKind(itemKind);
    setEditing(item);
    setName(item === "new" ? "" : item.name);
    setDescription(item === "new" ? "" : item.description);
    setCode(item !== "new" && "code" in item ? item.code : "");
    setDialogError(null);
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing || !name.trim() || (kind === "facilityTypes" && !code.trim())) return;
    setBusy(true);
    setDialogError(null);
    try {
      const id = editing === "new" ? null : editing.id;
      let saved: CatalogItem;
      if (kind === "sicknesses") {
        const data = { name: name.trim(), description: description.trim() };
        saved = id ? await sicknessApi.update(id, data) : await sicknessApi.create(data);
      } else if (kind === "facilityTypes") {
        const data = { name: name.trim(), code: code.trim(), description: description.trim() };
        const result = id ? await facilityTypeApi.update(id, data) : await facilityTypeApi.create(data);
        if (!result) throw new Error("Сервер не подтвердил сохранение типа учреждения.");
        saved = result;
      } else if (kind === "equipment") {
        const data = { name: name.trim(), description: description.trim() };
        saved = id ? await equipmentApi.update(id, data) : await equipmentApi.create(data);
      } else {
        const data = { name: name.trim(), description: description.trim() };
        saved = id ? await operatingTypeApi.update(id, data) : await operatingTypeApi.create(data);
      }
      setCatalogs((current) => ({
        ...current,
        [kind]: [saved, ...current[kind].filter((item) => item.id !== saved.id)],
      }));
      setEditing(null);
      showAlert({ title: editing === "new" ? "Запись создана" : "Изменения сохранены", type: "success" });
    } catch (cause) {
      setDialogError(message(cause));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      if (kind === "sicknesses") await sicknessApi.delete(deleting.id);
      else if (kind === "facilityTypes") await facilityTypeApi.delete(deleting.id);
      else if (kind === "equipment") await equipmentApi.delete(deleting.id);
      else await operatingTypeApi.delete(deleting.id);
      setCatalogs((current) => ({ ...current, [kind]: current[kind].filter((item) => item.id !== deleting.id) }));
      setDeleting(null);
      showAlert({ title: "Запись удалена", type: "success" });
    } catch (cause) {
      showAlert({ title: "Не удалось удалить запись", description: message(cause), type: "error" });
    } finally {
      setBusy(false);
    }
  };

  const meta = catalogMeta[kind];

  return (
    <>
      <SettingsSection ariaLabel="Справочники">
        <SettingsSectionHeader
          title="Справочники"
          description="Общие значения, используемые в формах и сосудистых центрах."
          action={
            <Button
              size="sm"
              variant="outline"
              onClick={() => void load()}
              disabled={loading}
            >
              <RefreshCw className={loading ? "animate-spin" : ""} />
              Обновить
            </Button>
          }
        />

        <InputGroup className="mt-5 w-full shadow-none sm:max-w-sm">
          <InputGroupAddon><Search /></InputGroupAddon>
          <InputGroupInput
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Поиск по всем справочникам"
            aria-label="Поиск по всем справочникам"
          />
        </InputGroup>

        {error && <Alert variant="destructive" className="mt-4"><AlertTitle>Не удалось загрузить справочники</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

        <div className="mt-6 space-y-4">
          {catalogKinds.map((itemKind) => {
            const itemMeta = catalogMeta[itemKind];
            const Icon = itemMeta.icon;
            const items = visibleCatalogs[itemKind];

            return (
              <section key={itemKind} className="overflow-hidden rounded-xl border">
                <header className="flex items-center gap-3 border-b p-4">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{itemMeta.title}</h3>
                      <span className="text-xs text-muted-foreground">{catalogs[itemKind].length}</span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{itemMeta.description}</p>
                  </div>
                  <Button size="sm" onClick={() => openEditor(itemKind, "new")}>
                    <Plus />Добавить
                  </Button>
                </header>

                {loading ? (
                  <div className="flex min-h-32 items-center justify-center gap-2 text-sm text-muted-foreground">
                    <LoaderCircle className="size-4 animate-spin" />Загрузка…
                  </div>
                ) : items.length === 0 ? (
                  <div className="flex min-h-32 flex-col items-center justify-center p-6 text-center">
                    <Icon className="mb-2 size-6 text-muted-foreground" />
                    <p className="text-sm font-medium">{query ? "Ничего не найдено" : "Справочник пуст"}</p>
                    {!query && (
                      <Button className="mt-3" size="sm" variant="outline" onClick={() => openEditor(itemKind, "new")}>
                        <Plus />Добавить запись
                      </Button>
                    )}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Название</TableHead>
                        {itemKind === "facilityTypes" && <TableHead>Код</TableHead>}
                        <TableHead>Описание</TableHead>
                        <TableHead className="w-24" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          {itemKind === "facilityTypes" && (
                            <TableCell className="font-mono text-xs">{"code" in item ? item.code : "—"}</TableCell>
                          )}
                          <TableCell className="max-w-md truncate text-muted-foreground">{item.description || "—"}</TableCell>
                          <TableCell>
                            <div className="flex justify-end">
                              <Button size="icon-sm" variant="ghost" aria-label={`Изменить ${item.name}`} onClick={() => openEditor(itemKind, item)}><Pencil /></Button>
                              <Button size="icon-sm" variant="ghost" aria-label={`Удалить ${item.name}`} onClick={() => { setKind(itemKind); setDeleting(item); }}><Trash2 /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </section>
            );
          })}
        </div>
      </SettingsSection>

      <Dialog open={editing !== null} onOpenChange={(open) => { if (!open && !busy) setEditing(null); }}>
        <DialogContent><form className="contents" onSubmit={save}><DialogHeader><DialogTitle>{editing === "new" ? `Добавить ${meta.itemName}` : `Изменить ${meta.itemName}`}</DialogTitle><DialogDescription>Значение станет доступно во всех связанных разделах.</DialogDescription></DialogHeader><FieldGroup className="gap-4"><Field className="gap-2"><FieldLabel htmlFor="catalog-item-name">Название</FieldLabel><Input id="catalog-item-name" value={name} onChange={(event) => { setName(event.target.value); setDialogError(null); }} required autoFocus disabled={busy} /></Field>{kind === "facilityTypes" && <Field className="gap-2"><FieldLabel htmlFor="catalog-item-code">Код</FieldLabel><Input id="catalog-item-code" value={code} onChange={(event) => { setCode(event.target.value); setDialogError(null); }} required disabled={busy} placeholder="vascular_center" /></Field>}<Field className="gap-2"><FieldLabel htmlFor="catalog-item-description">Описание</FieldLabel><Textarea id="catalog-item-description" value={description} onChange={(event) => setDescription(event.target.value)} disabled={busy} /></Field>{dialogError && <FieldError>{dialogError}</FieldError>}</FieldGroup><DialogFooter><Button type="button" variant="outline" onClick={() => setEditing(null)} disabled={busy}>Отмена</Button><Button type="submit" disabled={busy || !name.trim() || (kind === "facilityTypes" && !code.trim())}>{busy && <LoaderCircle className="animate-spin" />}Сохранить</Button></DialogFooter></form></DialogContent>
      </Dialog>

      <Dialog open={deleting !== null} onOpenChange={(open) => { if (!open && !busy) setDeleting(null); }}>
        <DialogContent><DialogHeader><DialogTitle>Удалить запись?</DialogTitle><DialogDescription>«{deleting?.name}» нельзя удалить, если значение используется в формах или центрах.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDeleting(null)} disabled={busy}>Отмена</Button><Button variant="destructive" onClick={() => void remove()} disabled={busy}>{busy && <LoaderCircle className="animate-spin" />}Удалить</Button></DialogFooter></DialogContent>
      </Dialog>
    </>
  );
}
