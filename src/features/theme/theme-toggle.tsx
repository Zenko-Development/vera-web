"use client";

import {
  type MouseEvent as ReactMouseEvent,
} from "react";
import { flushSync } from "react-dom";
import { Moon, Sun } from "lucide";
import { useTheme } from "next-themes";

import { MorphIcon } from "@/components/ui/morph-icon";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const toggleTheme = async (event: ReactMouseEvent<HTMLButtonElement>) => {
    const nextTheme = isDark ? "light" : "dark";
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (!document.startViewTransition || reduceMotion) {
      setTheme(nextTheme);
      return;
    }

    const buttonBounds = event.currentTarget.getBoundingClientRect();
    const x = buttonBounds.left + buttonBounds.width / 2;
    const y = buttonBounds.top + buttonBounds.height / 2;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    const transition = document.startViewTransition(() => {
      flushSync(() => setTheme(nextTheme));
    });

    try {
      await transition.ready;
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0 at ${x}px ${y}px)`,
            `circle(${radius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 550,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          pseudoElement: "::view-transition-new(root)",
        },
      );
    } catch {
      // Тема уже применена, даже если браузер отменил анимацию перехода.
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger
        delay={0}
        render={
          <button
            type="button"
            aria-label={isDark ? "Включить светлую тему" : "Включить тёмную тему"}
            onClick={(event) => void toggleTheme(event)}
            className="flex size-9 items-center justify-center rounded-full border bg-popover/90 text-popover-foreground outline-none backdrop-blur-sm transition hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
          />
        }
      >
        <MorphIcon icon={isDark ? Sun : Moon} size={16} />
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>{isDark ? "Светлая тема" : "Тёмная тема"}</p>
      </TooltipContent>
    </Tooltip>
  );
}
