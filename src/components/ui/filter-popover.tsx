import type { ReactNode } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function FilterPopover({
  children,
  activeCount = 0,
  onClear,
  label = "Фильтры",
}: {
  children: ReactNode;
  activeCount?: number;
  onClear?: () => void;
  label?: string;
}) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant={activeCount > 0 ? "secondary" : "outline"}
            size="sm"
            aria-label={activeCount > 0 ? `${label}, выбрано: ${activeCount}` : label}
          />
        }
      >
        <SlidersHorizontal />
        {label}
        {activeCount > 0 && (
          <span className="flex min-w-5 items-center justify-center rounded-full bg-foreground px-1.5 text-[11px] font-semibold leading-5 text-background">
            {activeCount}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(22rem,calc(100vw-2rem))] gap-4 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="font-medium">{label}</p>
          {activeCount > 0 && onClear && (
            <Button type="button" variant="ghost" size="xs" onClick={onClear}>
              Сбросить
            </Button>
          )}
        </div>
        <div className="grid gap-4">{children}</div>
      </PopoverContent>
    </Popover>
  );
}

