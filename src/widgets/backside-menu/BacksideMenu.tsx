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
import { useUnsavedNavigation } from "@/features/unsaved-changes/unsaved-changes-provider";
import { cn } from "@/lib/utils";
import Logo from "@/shared/assets/icons/logo-icon.svg";

type MenuItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  permissions?: string[];
};

const primaryItems: MenuItem[] = [
  { href: "/", label: "Главная", icon: LayoutDashboard },
  { href: "/users", label: "Пользователи", icon: UsersRound, permissions: ["user.manage"] },
  { href: "/hospitals", label: "Сосудистые центры", icon: Hospital, permissions: ["hospital.read", "hospital.manage", "hospital_staff.manage"] },
  { href: "/map", label: "Карта", icon: MapPinned, permissions: ["fleet_location.read", "hospital_arrival.read"] },
  { href: "/forms", label: "Формы", icon: ListTodo, permissions: ["checklist.read", "checklist.manage"] },
  { href: "/fleet", label: "Машины и планшеты", icon: Ambulance, permissions: ["ambulance_vehicle.manage", "device.read", "device.provision"] },
  { href: "/analytics", label: "История действий", icon: RotateCcwClock, permissions: ["analytics.read"] },
];

const secondaryItems: MenuItem[] = [
  { href: "/settings", label: "Настройки", icon: Settings, permissions: ["rbac.manage", "geo_tracking_policy.manage", "facility_type.manage", "sickness.manage"] },
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
  const { logout, user } = useAuth();
  const { requestNavigation } = useUnsavedNavigation();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const canSee = (item: MenuItem) =>
    !item.permissions ||
    item.permissions.some((permission) => user?.permissions.includes(permission));

  const performLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    router.replace("/login");
  };

  const confirmLogout = () => {
    requestNavigation(() => void performLogout());
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
          {primaryItems.filter(canSee).map((item) => (
            <MenuLink
              key={item.href}
              item={item}
              active={matchesPath(pathname, item.href)}
            />
          ))}
        </nav>
      </div>

      <nav className="flex flex-col items-center" aria-label="Дополнительно">
        {secondaryItems.filter(canSee).map((item) => (
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
              onClick={confirmLogout}
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
