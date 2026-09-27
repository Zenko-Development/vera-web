"use client";

import {
  useEffect,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { flushSync } from "react-dom";
import { Moon, Sun } from "lucide";
import { Clock } from "lucide-react";
import { useTheme } from "next-themes";
import { MorphIcon } from "@/components/ui/morph-icon";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const HeaderRight = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const [timeString, setTimeString] = useState("--:--");
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    const updateTime = () => {
      setTimeString(
        new Date().toLocaleTimeString("ru-RU", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    };
    const initialTimer = window.setTimeout(updateTime, 0);
    const interval = window.setInterval(updateTime, 30_000);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(interval);
    };
  }, []);

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
      // The theme is already applied if the browser cancels the transition.
    }
  };

  return (
    <div className="absolute top-3 right-3 z-10 flex items-center gap-1 ">
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
        <TooltipContent side="bottom" >
          <p>{isDark ? "Светлая тема" : "Тёмная тема"}</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          delay={0}
          render={
            <time
              dateTime={timeString}
              tabIndex={0}
              className="flex h-9 items-center gap-2 rounded-full border bg-popover/90 px-3 text-sm font-medium text-popover-foreground outline-none backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-ring"
            />
          }
        >
          {timeString}
          <Clock className="size-4" />
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Время</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};
