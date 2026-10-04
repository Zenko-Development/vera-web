const permissionNames: Record<string, string> = {
  "rbac.manage": "Управление ролями и правами",
  "user.manage": "Управление пользователями",
  "device.read": "Просмотр планшетов",
  "device.provision": "Регистрация планшетов",
  "device.reset_secret": "Замена секрета планшета",
  "device.change_status": "Отключение планшетов",
  "device.delete": "Удаление планшетов",
  "ambulance_vehicle.manage": "Управление машинами",
  "hospital.read": "Просмотр больниц",
  "hospital.manage": "Управление больницами",
  "hospital_service_area.manage": "Управление зонами обслуживания",
  "facility_type.manage": "Управление типами учреждений",
  "sickness.manage": "Управление заболеваниями",
  "checklist.read": "Просмотр форм",
  "checklist.manage": "Управление формами",
  "checklist.publish": "Публикация форм",
  "emergency_call.read": "Просмотр вызовов",
  "hospital_arrival.read": "Просмотр прибытий",
  "fleet_location.read": "Просмотр геопозиции автопарка",
  "geo_tracking_policy.manage": "Настройка геопозиции",
  "analytics.read": "Просмотр аналитики и аудита",
  "hospital_resource.read": "Просмотр ресурсов больниц",
  "hospital_resource.manage": "Управление ресурсами больниц",
  "hospital_resource.change_status": "Изменение состояния ресурсов",
  "hospital_staff.manage": "Назначение сотрудников в больницы",
};

export function getPermissionDisplayName(name: string): string {
  return permissionNames[name] ?? "Дополнительное право доступа";
}
