import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type ScrollFadeProps = ComponentProps<"div"> & {
  viewportClassName?: string;
  fadeClassName?: string;
  edgeClassName?: string;
};

export function ScrollFade({
  children,
  className,
  viewportClassName,
  fadeClassName,
  edgeClassName,
  ...props
}: ScrollFadeProps) {
  return (
    <div
      data-slot="scroll-fade"
      className={cn("relative min-h-0 overflow-hidden", className)}
      {...props}
    >
      <div
        data-slot="scroll-fade-viewport"
        className={cn("h-full overflow-auto", viewportClassName)}
      >
        <div
          aria-hidden="true"
          className={cn("h-4 w-full bg-muted dark:bg-background", edgeClassName)}
        />
        {children}
        <div
          aria-hidden="true"
          className={cn("h-4 w-full bg-muted dark:bg-background", edgeClassName)}
        />
      </div>
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 z-20 h-4 bg-linear-to-b from-muted to-transparent dark:from-background",
          fadeClassName,
        )}
      />
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 z-20 h-4 bg-linear-to-t from-muted to-transparent dark:from-background",
          fadeClassName,
        )}
      />
    </div>
  );
}
