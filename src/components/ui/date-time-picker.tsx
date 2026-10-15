"use client";

import { useMemo } from "react";
import { format, isSameDay, startOfDay } from "date-fns";
import { ru } from "date-fns/locale";
import { CalendarDays, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type DateTimePickerProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
};

function parseLocalDateTime(value: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : undefined;
}

function toLocalDateTime(date: Date): string {
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return shifted.toISOString().slice(0, 16);
}

export function DateTimePicker({
  id,
  value,
  onChange,
  min,
  disabled,
  placeholder = "Выберите дату и время",
  className,
}: DateTimePickerProps) {
  const selected = useMemo(() => parseLocalDateTime(value), [value]);
  const minimum = useMemo(() => parseLocalDateTime(min ?? ""), [min]);

  const selectDay = (day: Date | undefined) => {
    if (!day) return;
    const next = new Date(day);
    next.setHours(selected?.getHours() ?? 9, selected?.getMinutes() ?? 0, 0, 0);
    if (minimum && next < minimum) next.setTime(minimum.getTime());
    onChange(toLocalDateTime(next));
  };

  const selectTime = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    const next = selected ? new Date(selected) : new Date();
    next.setHours(hours, minutes, 0, 0);
    if (minimum && next < minimum) next.setTime(minimum.getTime());
    onChange(toLocalDateTime(next));
  };

  const minimumTime = minimum && selected && isSameDay(minimum, selected)
    ? format(minimum, "HH:mm")
    : undefined;

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn("w-full justify-start font-normal", !selected && "text-muted-foreground", className)}
          />
        }
      >
        <CalendarDays className="text-muted-foreground" />
        <span className="truncate">
          {selected ? format(selected, "d MMMM yyyy, HH:mm", { locale: ru }) : placeholder}
        </span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto gap-0 p-0">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={selectDay}
          locale={ru}
          disabled={minimum ? { before: startOfDay(minimum) } : undefined}
          autoFocus
        />
        <div className="border-t p-3">
          <InputGroup>
            <InputGroupAddon><Clock3 /></InputGroupAddon>
            <InputGroupInput
              type="time"
              step={300}
              value={selected ? format(selected, "HH:mm") : "09:00"}
              min={minimumTime}
              onChange={(event) => selectTime(event.target.value)}
              aria-label="Время"
            />
          </InputGroup>
        </div>
      </PopoverContent>
    </Popover>
  );
}
