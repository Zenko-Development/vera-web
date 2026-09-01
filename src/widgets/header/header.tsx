import React from "react";
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
  return (
    <div className="flex flex-col gap-1 h-12 ">
      <div className="flex gap-2 ">
        <h1 className="text-2xl font-semibold ">{title}</h1>
        {counter && <p className="opacity-40">({counter})</p>}
      </div>
      {subtitle && (
        <h2 className="leading-0" style={{ color: subtitleColor }}>
          {subtitle}
        </h2>
      )}
    </div>
  );
};
