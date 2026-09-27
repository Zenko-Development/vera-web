"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { FieldError } from "@/components/ui/field";
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
import { Textarea } from "@/components/ui/textarea";
import type { FacilityType } from "@/entities/facility-type/model/types";
import type {
  CreateHospitalRequest,
  Hospital,
  UpdateHospitalRequest,
} from "@/entities/hospital/model/types";
import type { Sickness } from "@/entities/sickness/model/types";
import { useAlert } from "@/features/alert/alert-store";
import { getHospitalsErrorMessage } from "../hooks/use-hospitals";
import { AddressSearch } from "./address-search";

type FormState = {
  name: string;
  description: string;
  facilityTypeId: string;
  address: string;
  phone: string;
  latitude: string;
  longitude: string;
};

type FormField = keyof FormState;

const emptyForm: FormState = {
  name: "",
  description: "",
  facilityTypeId: "",
  address: "",
  phone: "",
  latitude: "",
  longitude: "",
};

type Props = {
  target: Hospital | "new" | null;
  facilityTypes: FacilityType[];
  sicknesses: Sickness[];
  onOpenChange: (open: boolean) => void;
  onLoadSicknesses: (hospitalId: string) => Promise<Sickness[]>;
  onCreate: (
    data: CreateHospitalRequest,
    sicknessIds: string[],
  ) => Promise<Hospital>;
  onUpdate: (
    id: Hospital["id"],
    data: UpdateHospitalRequest,
    sicknessIds: string[],
  ) => Promise<Hospital>;
};

function getInitialForm(target: Hospital | "new"): FormState {
  if (target === "new") return emptyForm;
  return {
    name: target.name,
    description: target.description,
    facilityTypeId: target.facility_type_id,
    address: target.address,
    phone: target.phone,
    latitude: target.latitude ? String(target.latitude) : "",
    longitude: target.longitude ? String(target.longitude) : "",
  };
}

export function HospitalForm({
  target,
  facilityTypes,
  sicknesses,
  onOpenChange,
  onLoadSicknesses,
  onCreate,
  onUpdate,
}: Props) {
  const [isBusy, setIsBusy] = useState(false);
  const [contentTarget, setContentTarget] = useState<Hospital | "new">("new");
  const targetKey = target === null ? null : target === "new" ? "new" : target.id;
  const contentKey = contentTarget === "new" ? "new" : contentTarget.id;

  if (target && targetKey !== contentKey) {
    setContentTarget(target);
  }

  return (
    <Drawer
      swipeDirection="right"
      open={target !== null}
      onOpenChange={(open) => {
        if (!open && isBusy) return;
        onOpenChange(open);
      }}
      onOpenChangeComplete={(open) => {
        if (!open) {
          setContentTarget("new");
          setIsBusy(false);
        }
      }}
    >
      <HospitalFormFields
        key={contentKey}
        target={contentTarget}
        facilityTypes={facilityTypes}
        sicknesses={sicknesses}
        onOpenChange={onOpenChange}
        onLoadSicknesses={onLoadSicknesses}
        onCreate={onCreate}
        onUpdate={onUpdate}
        onBusyChange={setIsBusy}
      />
    </Drawer>
  );
}

type HospitalFormFieldsProps = Omit<Props, "target"> & {
  target: Hospital | "new";
  onBusyChange: (busy: boolean) => void;
};

function HospitalFormFields({
  target,
  facilityTypes,
  sicknesses,
  onOpenChange,
  onLoadSicknesses,
  onCreate,
  onUpdate,
  onBusyChange,
}: HospitalFormFieldsProps) {
  const showAlert = useAlert();
  const [form, setForm] = useState<FormState>(() => getInitialForm(target));
  const [errors, setErrors] = useState<Partial<Record<FormField, string>>>({});
  const [selectedSicknessIds, setSelectedSicknessIds] = useState<string[]>([]);
  const [isLoadingSicknesses, setIsLoadingSicknesses] = useState(target !== "new");
  const [isSaving, setIsSaving] = useState(false);
  const isEditing = target !== "new";

  useEffect(() => {
    if (target === "new") return;

    let isActive = true;
    onLoadSicknesses(target.id)
      .then((linked) => {
        if (isActive) setSelectedSicknessIds(linked.map((item) => item.id));
      })
      .catch((error) => {
        if (!isActive) return;
        showAlert({
          title: "Не удалось загрузить заболевания центра",
          description: getHospitalsErrorMessage(error),
          type: "error",
        });
      })
      .finally(() => {
        if (isActive) setIsLoadingSicknesses(false);
      });

    return () => {
      isActive = false;
    };
  }, [onLoadSicknesses, showAlert, target]);

  const setField = (field: FormField, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const toggleSickness = (id: string, checked: boolean) => {
    setSelectedSicknessIds((current) =>
      checked
        ? Array.from(new Set([...current, id]))
        : current.filter((item) => item !== id),
    );
  };

  const validate = () => {
    const nextErrors: Partial<Record<FormField, string>> = {};
    const latitude = form.latitude.trim();
    const longitude = form.longitude.trim();

    if (!form.name.trim()) nextErrors.name = "Укажите название центра";
    if (!form.address.trim()) nextErrors.address = "Укажите адрес";
    if (!form.facilityTypeId) nextErrors.facilityTypeId = "Выберите тип учреждения";
    if ((latitude && !longitude) || (!latitude && longitude)) {
      nextErrors.latitude = "Укажите обе координаты";
      nextErrors.longitude = "Укажите обе координаты";
    }

    const latitudeNumber = Number(latitude);
    const longitudeNumber = Number(longitude);
    if (latitude && (!Number.isFinite(latitudeNumber) || latitudeNumber < -90 || latitudeNumber > 90)) {
      nextErrors.latitude = "Широта должна быть от −90 до 90";
    }
    if (longitude && (!Number.isFinite(longitudeNumber) || longitudeNumber < -180 || longitudeNumber > 180)) {
      nextErrors.longitude = "Долгота должна быть от −180 до 180";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    const data: UpdateHospitalRequest = {
      name: form.name.trim(),
      description: form.description.trim(),
      address: form.address.trim(),
      phone: form.phone.trim(),
      facility_type_id: form.facilityTypeId,
      latitude: form.latitude.trim() ? Number(form.latitude) : 0,
      longitude: form.longitude.trim() ? Number(form.longitude) : 0,
    };

    setIsSaving(true);
    onBusyChange(true);
    try {
      const saved =
        target === "new"
          ? await onCreate(data, selectedSicknessIds)
          : await onUpdate(target.id, data, selectedSicknessIds);
      showAlert({
        title: target === "new" ? "Сосудистый центр создан" : "Данные центра обновлены",
        description: saved.name,
        type: "success",
      });
      onOpenChange(false);
    } catch (error) {
      showAlert({
        title: target === "new" ? "Не удалось создать центр" : "Не удалось обновить центр",
        description: getHospitalsErrorMessage(error),
        type: "error",
      });
    } finally {
      setIsSaving(false);
      onBusyChange(false);
    }
  };

  const disabled = isSaving || isLoadingSicknesses;

  return (
    <DrawerContent className="m-3 w-full max-w-xl">
        <DrawerHeader className="flex-row items-start justify-between border-b pb-4">
          <div>
            <DrawerTitle className="text-xl">
              {isEditing ? "Изменить сосудистый центр" : "Новый сосудистый центр"}
            </DrawerTitle>
            <DrawerDescription className="mt-1">
              Контакты, местоположение и медицинские направления центра.
            </DrawerDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            <X />
            <span className="sr-only">Закрыть</span>
          </Button>
        </DrawerHeader>

        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 space-y-7 overflow-y-auto p-4">
            <FormSection number="1" title="Основные данные" description="Название и тип учреждения">
              <FormInput
                id="hospital-name"
                label="Название"
                value={form.name}
                error={errors.name}
                onChange={(value) => setField("name", value)}
                disabled={disabled}
                autoFocus
                required
              />
              <div className="grid gap-2">
                <Label htmlFor="hospital-description">Описание</Label>
                <Textarea
                  id="hospital-description"
                  value={form.description}
                  onChange={(event) => setField("description", event.target.value)}
                  disabled={disabled}
                  rows={3}
                  className="shadow-none"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="hospital-facility-type">Тип учреждения</Label>
                <Select
                  value={form.facilityTypeId || null}
                  onValueChange={(value) => setField("facilityTypeId", value ?? "")}
                  disabled={disabled || facilityTypes.length === 0}
                >
                  <SelectTrigger
                    id="hospital-facility-type"
                    className="w-full shadow-none"
                    aria-invalid={Boolean(errors.facilityTypeId)}
                  >
                    <SelectValue placeholder="Выберите тип" />
                  </SelectTrigger>
                  <SelectContent align="start">
                    <SelectGroup>
                      <SelectLabel>Типы учреждений</SelectLabel>
                      {facilityTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {errors.facilityTypeId && <FieldError>{errors.facilityTypeId}</FieldError>}
                {facilityTypes.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Сначала добавьте тип учреждения в разделе <Link href="/settings?section=catalogs" className="underline underline-offset-4">Настройки → Справочники</Link>.
                  </p>
                )}
              </div>
            </FormSection>

            <FormSection number="2" title="Контакты и местоположение" description="Адрес для бригады и координаты для маршрутизации">
              <AddressSearch
                value={form.address}
                error={errors.address}
                onChange={(value) => setField("address", value)}
                onSelect={(result) => {
                  setField("address", result.label);
                  setField("latitude", String(result.latitude));
                  setField("longitude", String(result.longitude));
                }}
                disabled={disabled}
              />
              <FormInput
                id="hospital-phone"
                label="Телефон"
                type="tel"
                value={form.phone}
                error={errors.phone}
                onChange={(value) => setField("phone", value)}
                disabled={disabled}
                placeholder="+7 900 000-00-00"
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormInput
                  id="hospital-latitude"
                  label="Широта"
                  type="number"
                  value={form.latitude}
                  error={errors.latitude}
                  onChange={(value) => setField("latitude", value)}
                  disabled={disabled}
                  min={-90}
                  max={90}
                  step="any"
                  placeholder="55.7558"
                />
                <FormInput
                  id="hospital-longitude"
                  label="Долгота"
                  type="number"
                  value={form.longitude}
                  error={errors.longitude}
                  onChange={(value) => setField("longitude", value)}
                  disabled={disabled}
                  min={-180}
                  max={180}
                  step="any"
                  placeholder="37.6173"
                />
              </div>
              <p className="text-xs text-muted-foreground">Координаты необязательны, но нужны для расчёта расстояния и ETA. Если указываете одну координату, укажите и вторую.</p>
            </FormSection>

            <FormSection number="3" title="Принимаемые направления" description="По каким заболеваниям центр доступен для выбора">
              <p className="-mt-2 text-sm text-muted-foreground">
                Выберите заболевания, по которым бригада может направить пациента в этот центр.
              </p>
              {isLoadingSicknesses ? (
                <div className="flex items-center gap-2 rounded-xl border p-4 text-sm text-muted-foreground">
                  <LoaderCircle className="size-4 animate-spin" /> Загружаем направления…
                </div>
              ) : sicknesses.length === 0 ? (
                <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                  Заболевания пока не созданы. Добавьте их в разделе «Настройки → Справочники».
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {sicknesses.map((sickness) => {
                    const checked = selectedSicknessIds.includes(sickness.id);
                    return (
                      <Label
                        key={sickness.id}
                        htmlFor={`hospital-sickness-${sickness.id}`}
                        className="flex cursor-pointer items-start gap-3 rounded-xl border p-3 hover:bg-muted/50"
                      >
                        <Checkbox
                          id={`hospital-sickness-${sickness.id}`}
                          checked={checked}
                          onCheckedChange={(next) => toggleSickness(sickness.id, next)}
                          disabled={disabled}
                        />
                        <span className="min-w-0">
                          <span className="block text-sm font-medium">{sickness.name}</span>
                          {sickness.description && (
                            <span className="mt-0.5 line-clamp-2 block text-xs font-normal text-muted-foreground">
                              {sickness.description}
                            </span>
                          )}
                        </span>
                      </Label>
                    );
                  })}
                </div>
              )}
            </FormSection>
          </div>

          <DrawerFooter className="border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={disabled || facilityTypes.length === 0}
            >
              {isSaving && <LoaderCircle className="animate-spin" />}
              {isEditing ? "Сохранить изменения" : "Создать центр"}
            </Button>
          </DrawerFooter>
        </form>
    </DrawerContent>
  );
}

function FormSection({ number, title, description, children }: { number: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{number}</span>
        <div><h3 className="font-medium">{title}</h3><p className="mt-0.5 text-xs text-muted-foreground">{description}</p></div>
      </div>
      {children}
    </section>
  );
}

function FormInput({
  id,
  label,
  value,
  error,
  onChange,
  required,
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
      <Label htmlFor={id}>{label}{required && <span className="text-destructive" aria-hidden="true"> *</span>}</Label>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        className="shadow-none"
        required={required}
        {...props}
      />
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}
