import { ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { User } from "@/entities/user/model/types";
import { getUserFullName, getUserInitials } from "../lib/user-presenters";
import { AccessBadge } from "./users-grid";

type UsersTableProps = {
  users: User[];
  roleNames: Record<string, string>;
  onUserOpen: (user: User) => void;
};

export function UsersTable({ users, roleNames, onUserOpen }: UsersTableProps) {
  return (
    <div className="overflow-hidden rounded-xl bg-card text-card-foreground ring-1 ring-border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Пользователь</TableHead>
            <TableHead>Имя пользователя</TableHead>
            <TableHead>Роль</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead className="w-10">
              <span className="sr-only">Открыть</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <button
                  type="button"
                  onClick={() => onUserOpen(user)}
                  className="flex items-center gap-3 rounded-md text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <Avatar>
                    <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{getUserFullName(user)}</span>
                </button>
              </TableCell>
              <TableCell className="text-muted-foreground">
                @{user.user_name}
              </TableCell>
              <TableCell>
                {roleNames[user.role_id] ?? "Роль не найдена"}
              </TableCell>
              <TableCell>
                <AccessBadge enabled={user.acces_status} />
              </TableCell>
              <TableCell>
                <button
                  type="button"
                  onClick={() => onUserOpen(user)}
                  className="rounded-md p-1 text-muted-foreground outline-none transition hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                  aria-label={`Открыть ${getUserFullName(user)}`}
                >
                  <ChevronRight className="size-4" />
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
