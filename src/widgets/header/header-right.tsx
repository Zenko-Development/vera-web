import { Bell, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WithTooltip } from "@/components/composite/with-tooltip";

export const HeaderRight = () => {
  const currentTime = new Date();
  
  // Форматирование времени с добавлением нуля
  const hours = String(currentTime.getHours()).padStart(2, '0');
  const minutes = String(currentTime.getMinutes()).padStart(2, '0');
  const timeString = `${hours}:${minutes}`;

  return (
    <div className="flex absolute right-3 top-3">
      <WithTooltip
        children={
          <Button className="rounded-full bg-white hover:bg-gray-50">
            <Bell color="black" />
          </Button>
        }
        tooltipContent={<p>Уведомления</p>}
        side="bottom"
      />
      <WithTooltip
        children={
          <Button className="text-black flex rounded-full bg-white hover:bg-gray-50 gap-2">
            {timeString}
            <Clock color="black" />
          </Button>
        }
        tooltipContent={<p>Время</p>}
        side="bottom"
      />
    </div>
  );
};