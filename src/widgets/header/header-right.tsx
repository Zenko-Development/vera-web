import { Bell, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const HeaderRight = () => {
  const currentTime = new Date();

  // Форматирование времени с добавлением нуля
  const hours = String(currentTime.getHours()).padStart(2, "0");
  const minutes = String(currentTime.getMinutes()).padStart(2, "0");
  const timeString = `${hours}:${minutes}`;

  return (
    <div className="flex absolute right-3 top-3">
      <Tooltip>
        <TooltipTrigger
          render={
            <Button className="rounded-full bg-white hover:bg-gray-50">
              <Bell color="black" />
            </Button>
          }
        />
        <TooltipContent side="bottom">
          <p>Уведомления</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button className="text-black flex rounded-full bg-white hover:bg-gray-50 gap-2">
              {timeString}
              <Clock color="black" />
            </Button>
          }
        />
        <TooltipContent side="bottom">
          <p>Время</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};
