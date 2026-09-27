"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const HeaderRight = () => {
  const [timeString, setTimeString] = useState("--:--");

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
    <div className="absolute top-3 right-3 z-10 flex">
      <Tooltip>
        <TooltipTrigger
          delay={0}
          render={
            <time
              dateTime={timeString}
              tabIndex={0}
              className="flex h-9 items-center gap-2 rounded-full bg-white px-3 text-sm font-medium text-black ring-1 ring-black/5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
