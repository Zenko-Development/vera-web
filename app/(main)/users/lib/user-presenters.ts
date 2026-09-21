import type { User } from "@/entities/user/model/types";

export function getUserFullName(user: User): string {
  return [user.name_last, user.name_first, user.name_middle]
    .filter(Boolean)
    .join(" ");
}

export function getUserInitials(user: User): string {
  const initials = [user.name_first, user.name_last]
    .filter(Boolean)
    .map((part) => part.charAt(0).toLocaleUpperCase("ru"))
    .join("");

  return initials || user.user_name.slice(0, 2).toLocaleUpperCase("ru") || "?";
}

export function getUserSearchValue(user: User): string {
  return `${getUserFullName(user)} ${user.user_name}`.toLocaleLowerCase("ru");
}
