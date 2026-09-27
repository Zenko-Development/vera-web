"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Ambulance,
  Hospital,
  LayoutDashboard,
  ListTodo,
  LogOut,
  MapPinned,
  MessageCircleQuestionMark,
  RotateCcwClock,
  Settings,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/features/auth/useAuth";
import { cn } from "@/lib/utils";
import Logo from "@/shared/assets/icons/logo-icon.svg";

type MenuItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const primaryItems: MenuItem[] = [
  { href: "/", label: "Главная", icon: LayoutDashboard },
  { href: "/users", label: "Пользователи", icon: UsersRound },
  { href: "/hospitals", label: "Сосудистые центры", icon: Hospital },
  { href: "/map", label: "Карта", icon: MapPinned },
  { href: "/forms", label: "Формы", icon: ListTodo },
  { href: "/fleet", label: "Машины и планшеты", icon: Ambulance },
  { href: "/analytics", label: "История действий", icon: RotateCcwClock },
];

const secondaryItems: MenuItem[] = [
  { href: "/settings", label: "Настройки", icon: Settings },
  { href: "/help", label: "Помощь", icon: MessageCircleQuestionMark },
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
        delay={0}
        render={
          <Link
            href={item.href}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex size-10 items-center justify-center rounded-full text-white transition-all outline-none hover:bg-white/15 hover:text-white focus-visible:ring-2 focus-visible:ring-white/70",
              active &&
                "bg-white text-black hover:bg-white hover:text-black",
            )}
          />
        }
      >
        <Icon className="size-5"  />
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={12}>
        <p>{item.label}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export function BacksideMenu() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    router.replace("/login");
  };

  return (
    <aside
      className="flex h-full w-12 shrink-0 flex-col justify-between rounded-full bg-backside-background p-1"
      aria-label="Основная навигация"
    >
      <div className="flex min-h-0 flex-col gap-4">
        <Tooltip>
          <TooltipTrigger
            delay={0}
            render={
              <Link
                href="/"
                aria-label="Главная"
                className="flex size-10 items-center justify-center rounded-full text-white outline-none transition hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white/70"
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

        <nav className="flex min-h-0 flex-col items-center overflow-y-auto" aria-label="Разделы">
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
        <Tooltip>
          <TooltipTrigger
            delay={0}
            render={
              <button
                type="button"
                aria-label="Выйти из аккаунта"
                onClick={() => setLogoutOpen(true)}
                className="relative flex size-10 items-center justify-center rounded-full text-white transition-all outline-none hover:bg-white/15 hover:text-white focus-visible:ring-2 focus-visible:ring-white/70"
              />
            }
          >
            <LogOut className="size-5" />
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={12}>
            <p>Выйти из аккаунта</p>
          </TooltipContent>
        </Tooltip>
      </nav>

      <Dialog
        open={logoutOpen}
        onOpenChange={(open) => {
          if (!isLoggingOut) setLogoutOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Выйти из аккаунта?</DialogTitle>
            <DialogDescription>
              Для продолжения работы потребуется снова ввести имя пользователя и пароль.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setLogoutOpen(false)}
              disabled={isLoggingOut}
            >
              Остаться
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void confirmLogout()}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? "Выходим…" : "Выйти"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
