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
    <header className="mb-3 flex h-9 min-w-0 items-center pr-28">
      <div className="flex min-w-0 items-baseline gap-2">
        <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
        {counter !== undefined && (
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">{counter}</span>
        )}
      </div>
    </header>
  );
};
