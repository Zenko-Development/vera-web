const roleNames: Record<string, string> = {
  administrator: "Администратор",
  admin: "Администратор",
  analyst: "Аналитик",
  dispatcher: "Диспетчер",
  hospital_operator: "Сотрудник больницы",
};

export function getRoleDisplayName(name: string): string {
  return roleNames[name.trim().toLocaleLowerCase("ru-RU")] ?? name;
}
