import { isUuid } from "@/lib/data/application-validation";
import type { ModuleResource } from "@/lib/data/modules";

const resources: ModuleResource[] = ["contacts", "targetCompanies", "weeklyGoals"];
const roleTypes = ["SWE", "AI", "Backend", "Frontend", "ML"];
const priorities = ["Low", "Medium", "High"];

export function isModuleResource(value: unknown): value is ModuleResource {
  return typeof value === "string" && resources.includes(value as ModuleResource);
}

function isString(value: unknown) { return typeof value === "string"; }
function isBoolean(value: unknown) { return typeof value === "boolean"; }
function isNullableDate(value: unknown) { return value === null || (isString(value) && /^\d{4}-\d{2}-\d{2}$/.test(value)); }
function isCount(value: unknown) { return Number.isInteger(value) && Number(value) >= 0; }

export function isValidModuleRecord(resource: ModuleResource, value: unknown, requireId: boolean) {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  if (requireId && !isUuid(record.id)) return false;
  if (!isString(record.createdAt) || !isString(record.updatedAt)) return false;

  if (resource === "targetCompanies") {
    return isString(record.company) && record.company.trim().length > 0 &&
      isString(record.applicationSeason) && isString(record.notes) &&
      roleTypes.includes(String(record.roleType)) && priorities.includes(String(record.priorityLevel));
  }
  if (resource === "contacts") {
    return isString(record.name) && record.name.trim().length > 0 &&
      isString(record.company) && isString(record.role) && isString(record.linkedInUrl) &&
      isString(record.notes) && isBoolean(record.connected) &&
      isBoolean(record.referralRequested) && isBoolean(record.referralReceived) &&
      isNullableDate(record.lastContactedDate);
  }
  return isString(record.week) && /^\d{4}-W\d{2}$/.test(record.week) &&
    isCount(record.applicationGoal) && isCount(record.applicationsCompleted) &&
    isCount(record.networkingGoal) && isCount(record.networkingCompleted) &&
    isCount(record.leetCodeGoal) && isCount(record.leetCodeCompleted);
}
