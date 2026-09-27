import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { User } from "@/entities/user/model/types";
import { getUserFullName, getUserInitials } from "../lib/user-presenters";

type UsersGridProps = {
  users: User[];
  roleNames: Record<string, string>;
  onUserOpen: (user: User) => void;
};

export function UsersGrid({ users, roleNames, onUserOpen }: UsersGridProps) {
  return (
    <div className="grid content-start gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {users.map((user) => (
        <button
          key={user.id}
          type="button"
          onClick={() => onUserOpen(user)}
          className="group relative flex min-h-44 flex-col justify-between rounded-xl bg-white p-4 text-left ring-1 ring-black/5 transition hover:shadow-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-medium">{getUserFullName(user)}</p>
              <p className="mt-1 truncate text-sm text-muted-foreground">
                @{user.user_name}
              </p>
            </div>
            <Avatar size="lg">
              <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
            </Avatar>
          </div>

          <div className="mt-6 flex items-end justify-between gap-3">
            <div className="min-w-0 space-y-2">
              <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="size-4 shrink-0" />
                <span className="truncate">
                  {roleNames[user.role_id] ?? "Роль не найдена"}
                </span>
              </div>
              <AccessBadge enabled={user.acces_status} />
            </div>
            <ArrowUpRight className="size-5 shrink-0 rotate-45 text-muted-foreground opacity-0 transition group-hover:rotate-0 group-hover:opacity-100" />
          </div>
        </button>
      ))}
    </div>
  );
}

export function AccessBadge({ enabled }: { enabled: boolean }) {
  return (
    <span
      className={
        enabled
          ? "inline-flex rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700"
          : "inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600"
      }
    >
      {enabled ? "Доступ активен" : "Доступ отключён"}
    </span>
  );
}
