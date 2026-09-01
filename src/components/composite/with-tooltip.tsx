import React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

type Props = {
  side?: "right" | "left" | "top" | "bottom";
  sideOffset?: number;
  children: React.ReactNode;
  tooltipContent: React.ReactNode;
};

export const WithTooltip: React.FC<Props> = ({
  side,
  sideOffset,
  children,
  tooltipContent,
}) => {
  return (
    <Tooltip>
      <TooltipTrigger >{children}</TooltipTrigger>
      <TooltipContent side={side} sideOffset={sideOffset}>
        {tooltipContent}
      </TooltipContent>
    </Tooltip>
  );
};
