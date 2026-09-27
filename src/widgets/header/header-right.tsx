"use client";

import {
  useEffect,
  useState,
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

export const HeaderRight = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const isDark = resolvedTheme === "dark";
  const timeString = currentTime?.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  }) ?? "--:--";

  useEffect(() => {
    const updateTime = () => setCurrentTime(new Date());
    const initialTimer = window.setTimeout(updateTime, 0);
    const interval = window.setInterval(updateTime, 1_000);
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
              dateTime={currentTime?.toISOString()}
              tabIndex={0}
              className="flex h-9 items-center gap-2 rounded-full border bg-popover/90 px-3 text-sm font-medium text-popover-foreground outline-none backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-ring"
            />
          }
        >
          {timeString}
          <LiveClockIcon time={currentTime} />
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Время</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

function LiveClockIcon({ time }: { time: Date | null }) {
  const hours = time?.getHours() ?? 0;
  const minutes = time?.getMinutes() ?? 0;
  const seconds = time?.getSeconds() ?? 0;
  const hourAngle = ((hours % 12) + minutes / 60 + seconds / 3_600) * 30;
  const minuteAngle = (minutes + seconds / 60) * 6;

  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="11" />
      <line
        x1="12"
        y1="12"
        x2="12"
        y2="7.5"
        transform={`rotate(${hourAngle} 12 12)`}
      />
      <line
        x1="12"
        y1="12"
        x2="12"
        y2="5"
        transform={`rotate(${minuteAngle} 12 12)`}
      />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
