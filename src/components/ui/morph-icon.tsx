"use client";

import {
  MorphIcon as MorphIconPrimitive,
  type MorphIconProps,
} from "morphicons/react";

function MorphIcon({
  spring = "snappy",
  reducedMotion = "user",
  ...props
}: MorphIconProps) {
  return (
    <MorphIconPrimitive
      spring={spring}
      reducedMotion={reducedMotion}
      {...props}
    />
  );
}

export { MorphIcon };
