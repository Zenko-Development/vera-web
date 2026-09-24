import { ambulanceVehicleApi } from "@/entities/ambulance-vehicle/api/ambulance-vehicle.api";
import { analyticsEmergencyCallApi } from "@/entities/analytics-emergency-call/api/analytics-emergency-call.api";
import { auditEventApi } from "@/entities/audit-event/api/audit-event.api";
import { authApi } from "@/entities/auth/api/auth";
import { checklistAnswerApi } from "@/entities/checklist-answer/api/checklist-answer.api";
import { checklistApi } from "@/entities/checklist/api/checklist.api";
import { checklistOptionApi } from "@/entities/checklist-option/api/checklist-option.api";
import { checklistQuestionApi } from "@/entities/checklist-question/api/checklist-question.api";
import { checklistResultApi } from "@/entities/checklist-result/api/checklist-result.api";
import { checklistResultEquipmentRequirementApi } from "@/entities/checklist-result-equipment-requirement/api/checklist-result-equipment-requirement.api";
import { checklistResultOperatingRequirementApi } from "@/entities/checklist-result-operating-requirement/api/checklist-result-operating-requirement.api";
import { checklistResultRoutingApi } from "@/entities/checklist-result-routing/api/checklist-result-routing.api";
import { checklistRuleConditionApi } from "@/entities/checklist-rule-condition/api/checklist-rule-condition.api";
import { checklistRuleApi } from "@/entities/checklist-rule/api/checklist-rule.api";
import { checklistRunApi } from "@/entities/checklist-run/api/checklist-run.api";
import { checklistVersionApi } from "@/entities/checklist-version/api/checklist-version.api";
import { deviceAccessApi } from "@/entities/device-access/api/device-access.api";
import { deviceApi } from "@/entities/device/api/device.api";
import { emergencyCallApi } from "@/entities/emergency-call/api/emergency-call.api";
import { emergencyDestinationApi } from "@/entities/emergency-destination/api/emergency-destination.api";
import { emergencyLocationApi } from "@/entities/emergency-location/api/emergency-location.api";
import { equipmentApi } from "@/entities/equipment/api/equipment.api";
import { facilityTypeApi } from "@/entities/facility-type/api/facility-type.api";
import { geoTrackingPolicyApi } from "@/entities/geo-tracking-policy/api/geo-tracking-policy.api";
import { hospitalArrivalApi } from "@/entities/hospital-arrival/api/hospital-arrival.api";
import { hospitalApi } from "@/entities/hospital/api/hospital.api";
import { hospitalEquipmentApi } from "@/entities/hospital-equipment/api/hospital-equipment.api";
import { hospitalOperatingRoomApi } from "@/entities/hospital-operating-room/api/hospital-operating-room.api";
import { hospitalServiceAreaApi } from "@/entities/hospital-service-area/api/hospital-service-area.api";
import { hospitalSicknessApi } from "@/entities/hospital-sickness/api/hospital-sickness.api";
import { hospitalStaffApi } from "@/entities/hospital-staff/api/hospital-staff.api";
import { operatingTypeApi } from "@/entities/operating-type/api/operating-type.api";
import { permissionApi } from "@/entities/permission/api/permission.api";
import { roleApi } from "@/entities/role/api/role.api";
import { rolePermissionApi } from "@/entities/role-permission/api/role-permission.api";
import { sicknessApi } from "@/entities/sickness/api/sickness.api";
import { userApi } from "@/entities/user/api/user.api";

/** A single discoverable facade over all documented application endpoints. */
export const veraApiController = {
  auth: authApi,
  users: userApi,
  devices: deviceApi,
  deviceAccess: deviceAccessApi,
  ambulanceVehicles: ambulanceVehicleApi,
  analyticsEmergencyCalls: analyticsEmergencyCallApi,
  auditEvents: auditEventApi,
  roles: roleApi,
  permissions: permissionApi,
  rolePermissions: rolePermissionApi,
  hospitals: hospitalApi,
  hospitalServiceAreas: hospitalServiceAreaApi,
  hospitalEquipment: hospitalEquipmentApi,
  hospitalOperatingRooms: hospitalOperatingRoomApi,
  hospitalStaff: hospitalStaffApi,
  hospitalArrivals: hospitalArrivalApi,
  equipment: equipmentApi,
  operatingTypes: operatingTypeApi,
  geoTrackingPolicy: geoTrackingPolicyApi,
  sicknesses: sicknessApi,
  facilityTypes: facilityTypeApi,
  hospitalSicknesses: hospitalSicknessApi,
  checklists: checklistApi,
  checklistVersions: checklistVersionApi,
  checklistQuestions: checklistQuestionApi,
  checklistOptions: checklistOptionApi,
  checklistResults: checklistResultApi,
  checklistResultEquipmentRequirements:
    checklistResultEquipmentRequirementApi,
  checklistResultOperatingRequirements:
    checklistResultOperatingRequirementApi,
  checklistRules: checklistRuleApi,
  checklistRuleConditions: checklistRuleConditionApi,
  checklistResultRoutings: checklistResultRoutingApi,
  checklistRuns: checklistRunApi,
  checklistAnswers: checklistAnswerApi,
  emergencyCalls: emergencyCallApi,
  emergencyLocations: emergencyLocationApi,
  emergencyDestinations: emergencyDestinationApi,
} as const;
