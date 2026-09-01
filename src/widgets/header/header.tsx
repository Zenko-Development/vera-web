import React from "react";
import { Bell, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
type Props = {
  title?: string;
  subtitle?: string;
  subtitleColor?: string;
  counter?: number;
};

export const Header: React.FC<Props> = ({
  title = "Заголовок",
  subtitle,
  subtitleColor = "#000",
  counter,
}) => {
  const currentTime = new Date();

  return (
    <div className="w-full flex justify-between">
      <div className="flex flex-col gap-1">
        <div className="flex gap-2">
          <h1 className="text-2xl font-semibold">{title}</h1>
          {counter && <p className="opacity-40">({counter})</p>}
        </div>
        {subtitle && (
          <h2 className="leading-0" style={{ color: subtitleColor }}>
            {subtitle}
          </h2>
        )}
      </div>

      <div className="flex ">
        <Button className="rounded-full bg-gray-100 hover:bg-gray-200">
          <Bell color="black" />
        </Button>
        <Button className="text-black flex rounded-full bg-gray-100 hover:bg-gray-200">
          {currentTime.getHours()}:{currentTime.getMinutes()}
          <Clock color="black" />
        </Button>
        
      </div>
    </div>
  );
};
