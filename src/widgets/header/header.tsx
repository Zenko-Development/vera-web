import React from "react";
type Props = {
  title?: string;
  counter?: number;
};

export const Header: React.FC<Props> = ({
  title = "Заголовок",
  counter,
}) => {
  return (
    <header className="flex h-9 items-center pr-28 mb-3">
      <div className="flex items-baseline gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {counter !== undefined && (
          <span className="text-sm text-muted-foreground">{counter}</span>
        )}
      </div>
    </header>
  );
};
