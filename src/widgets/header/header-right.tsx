"use client";

import { useEffect, useState } from "react";
import { ThemeToggle } from "@/features/theme/theme-toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const HeaderRight = () => {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
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

  return (
    <div className="absolute top-3 right-3 z-10 flex items-center gap-1 ">
      <ThemeToggle />
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
