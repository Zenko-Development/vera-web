"use client";

import type { LucideIcon } from "lucide-react";
import {
  Hospital,
  LayoutDashboard,
  ListTodo,
  LogOut,
  MessageCircleQuestionMark,
  Settings,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import Logo from "@/shared/assets/icons/logo-icon.svg";

type MenuItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const primaryItems: MenuItem[] = [
  // { href: "/", label: "Метрики", icon: LayoutDashboard },
  { href: "/users", label: "Пользователи", icon: UsersRound },
  { href: "/hospitals", label: "Сосудистые центры", icon: Hospital },
  { href: "/forms", label: "Формы", icon: ListTodo },
];

const secondaryItems: MenuItem[] = [
  { href: "/settings", label: "Настройки", icon: Settings },
  { href: "/help", label: "Помощь", icon: MessageCircleQuestionMark },
  { href: "/logout", label: "Выйти из аккаунта", icon: LogOut },
];

function matchesPath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function MenuLink({ item, active }: { item: MenuItem; active: boolean }) {
  const Icon = item.icon;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Link
            href={item.href}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex size-10 items-center justify-center rounded-full text-white transition-all outline-none hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white/70",
              active &&
                "bg-white text-black shadow-sm hover:bg-white hover:text-black",
            )}
          />
        }
      >
        <Icon className="size-5" />
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={12}>
        <p>{item.label}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export function BacksideMenu() {
  const pathname = usePathname();

  return (
    <aside
      className="flex h-full w-12 shrink-0 flex-col justify-between rounded-full bg-black p-1"
      aria-label="Основная навигация"
    >
      <div className="flex flex-col gap-4">
        <Tooltip>
          <TooltipTrigger
            render={
              <Link
                href={primaryItems[0].href}
                aria-label="Главная"
                className="flex size-10 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              />
            }
          >
            <Logo
              fill="currentColor"
              className="size-full p-1 text-white"
            />
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={12}>
            <p>Главная</p>
          </TooltipContent>
        </Tooltip>

        <nav className="flex flex-col items-center" aria-label="Разделы">
          {primaryItems.map((item) => (
            <MenuLink
              key={item.href}
              item={item}
              active={matchesPath(pathname, item.href)}
            />
          ))}
        </nav>
      </div>

      <nav className="flex flex-col items-center" aria-label="Дополнительно">
        {secondaryItems.map((item) => (
          <MenuLink
            key={item.href}
            item={item}
            active={matchesPath(pathname, item.href)}
          />
        ))}
      </nav>
    </aside>
  );
}
