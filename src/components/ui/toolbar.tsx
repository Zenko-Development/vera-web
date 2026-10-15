import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Toolbar({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="toolbar"
      className={cn(
        "flex min-w-0 flex-wrap items-center gap-2 rounded-xl bg-card p-2 text-card-foreground ring-1 ring-border",
        className,
      )}
      {...props}
    />
  );
}

