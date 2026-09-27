import type { ReactNode } from "react";
import { ScrollFade } from "@/components/ui/scroll-fade";

type SettingsSectionProps = {
  ariaLabel: string;
  children: ReactNode;
};

export function SettingsSection({
  ariaLabel,
  children,
}: SettingsSectionProps) {
  return (
    <section
      role="tabpanel"
      aria-label={ariaLabel}
      className="min-h-0 flex-1"
    >
      <ScrollFade
        className="h-full"
        fadeClassName="from-card dark:from-card"
        edgeClassName="bg-card dark:bg-card"
      >
        <div className="mx-auto w-full max-w-5xl p-5 md:p-8">{children}</div>
      </ScrollFade>
    </section>
  );
}

type SettingsSectionHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function SettingsSectionHeader({
  title,
  description,
  action,
}: SettingsSectionHeaderProps) {
  return (
    <header>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">{title}</h2>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {description && (
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
    </header>
  );
}
