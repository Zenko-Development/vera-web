"use client";

import { useState } from "react";
import { LoaderCircle, Search } from "lucide";
import { Check, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MorphIcon } from "@/components/ui/morph-icon";

type AddressResult = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  type: string | null;
};

export function AddressSearch({
  value,
  error,
  disabled,
  onChange,
  onSelect,
}: {
  value: string;
  error?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  onSelect: (result: AddressResult) => void;
}) {
  const [results, setResults] = useState<AddressResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const search = async () => {
    const query = value.trim();
    if (query.length < 3) {
      setSearchError("Введите хотя бы 3 символа.");
      return;
    }
    setLoading(true);
    setSearchError(null);
    try {
      const response = await fetch(`/api/geocoding?query=${encodeURIComponent(query)}`);
      const payload = (await response.json()) as {
        data?: AddressResult[];
        message?: string;
      };
      if (!response.ok) throw new Error(payload.message ?? "Поиск не выполнен");
      setResults(payload.data ?? []);
      if (!payload.data?.length) setSearchError("Адреса не найдены. Уточните запрос.");
    } catch (cause) {
      setResults([]);
      setSearchError(cause instanceof Error ? cause.message : "Поиск не выполнен");
    } finally {
      setLoading(false);
    }
  };

  const choose = (result: AddressResult) => {
    setSelectedId(result.id);
    onSelect(result);
    setResults([]);
    setSearchError(null);
  };

  return (
    <div className="grid gap-2">
      <Label htmlFor="hospital-address">
        Адрес <span className="text-destructive" aria-hidden="true">*</span>
      </Label>
      <div className="flex gap-2">
        <Input
          id="hospital-address"
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setSelectedId(null);
            setResults([]);
            setSearchError(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void search();
            }
          }}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          placeholder="Город, улица, дом"
          className="shadow-none"
          required
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => void search()}
          disabled={disabled || loading || value.trim().length < 3}
        >
          <MorphIcon
            icon={loading ? LoaderCircle : Search}
            className={loading ? "animate-spin" : undefined}
          />
          Найти
        </Button>
      </div>
      {error && <FieldError>{error}</FieldError>}
      {searchError && <p className="text-xs text-destructive">{searchError}</p>}
      {results.length > 0 && (
        <div className="overflow-hidden rounded-xl border bg-popover text-popover-foreground">
          {results.map((result) => (
            <button
              key={result.id}
              type="button"
              onClick={() => choose(result)}
              className="flex w-full items-start gap-3 border-b p-3 text-left text-sm transition last:border-b-0 hover:bg-muted/60"
            >
              <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
              <span className="min-w-0 flex-1">{result.label}</span>
              {selectedId === result.id && <Check className="size-4 text-primary" />}
            </button>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Введите адрес и нажмите «Найти» или клавишу ввода. Данные ©{" "}
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline underline-offset-2">
          OpenStreetMap
        </a>.
      </p>
    </div>
  );
}
