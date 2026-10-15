export const dashboardPermissions = [
  "user.manage",
  "ambulance_vehicle.manage",
  "device.read",
  "hospital.read",
  "fleet_location.read",
  "hospital_arrival.read",
  "hospital_resource.read",
  "hospital_resource.change_status",
  "hospital_resource.manage",
  "analytics.read",
] as const;

export const settingsPermissions = [
  "rbac.manage",
  "geo_tracking_policy.manage",
  "facility_type.manage",
  "sickness.manage",
  "hospital_resource.read",
] as const;

export const fleetPermissions = [
  "ambulance_vehicle.manage",
  "device.read",
  "device.provision",
  "device.reset_secret",
  "device.change_status",
  "device.delete",
] as const;

export const hospitalPermissions = [
  "hospital.read",
  "hospital.manage",
  "hospital_service_area.manage",
  "hospital_arrival.read",
  "hospital_resource.read",
  "hospital_resource.change_status",
  "hospital_resource.manage",
  "hospital_staff.manage",
] as const;
/** Permissions required to open the hospital directory and hospital workspace. */
export const hospitalPagePermissions = ["hospital.read"] as const;
export const mapPermissions = [
  "hospital.read",
  "fleet_location.read",
  "hospital_arrival.read",
  "emergency_call.read",
  "emergency_call.destination.select",
] as const;
export const checklistPermissions = [
  "checklist.read",
  "checklist.manage",
  "checklist.publish",
] as const;
/** Permissions required to open the checklist directory. */
export const checklistPagePermissions = ["checklist.read"] as const;

export function hasPermission(
  permissions: readonly string[] | undefined,
  permission: string,
): boolean {
  return permissions?.includes(permission) ?? false;
}

export function hasAnyPermission(
  permissions: readonly string[] | undefined,
  required: readonly string[],
): boolean {
  return required.some((permission) => hasPermission(permissions, permission));
}

export function hasAllPermissions(
  permissions: readonly string[] | undefined,
  required: readonly string[],
): boolean {
  return required.every((permission) => hasPermission(permissions, permission));
}

export function getDefaultAppPath(permissions: readonly string[] | undefined): string {
  if (hasAnyPermission(permissions, dashboardPermissions)) return "/";
  if (hasPermission(permissions, "user.manage")) return "/users";
  if (hasAnyPermission(permissions, hospitalPagePermissions)) return "/hospitals";
  if (hasAnyPermission(permissions, mapPermissions)) return "/map";
  if (hasAnyPermission(permissions, checklistPagePermissions)) return "/forms";
  if (hasAnyPermission(permissions, fleetPermissions)) return "/fleet";
  if (hasPermission(permissions, "analytics.read")) return "/analytics";
  if (hasAnyPermission(permissions, settingsPermissions)) return "/settings";
  return "/help";
}
