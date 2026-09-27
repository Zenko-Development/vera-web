"use client";

import { useEffect, useState } from "react";
import { Clock, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
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

  return (
    <div className="absolute top-3 right-3 z-10 flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger
          delay={0}
          render={
            <button
              type="button"
              aria-label={isDark ? "Включить светлую тему" : "Включить тёмную тему"}
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="flex size-9 items-center justify-center rounded-full border bg-background/90 text-foreground outline-none backdrop-blur-sm transition hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
            />
          }
        >
          {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </TooltipTrigger>
        <TooltipContent side="bottom">
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
              className="flex h-9 items-center gap-2 rounded-full border bg-background/90 px-3 text-sm font-medium text-foreground outline-none backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-ring"
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
