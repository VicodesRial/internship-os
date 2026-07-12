import type { PriorityLevel, RoleType, TargetCompany } from "@/lib/types";

export const roleTypeOptions: RoleType[] = [
  "SWE",
  "AI",
  "Backend",
  "Frontend",
  "ML",
];

export const priorityLevelOptions: PriorityLevel[] = ["Low", "Medium", "High"];

export const priorityThemeClasses: Record<
  PriorityLevel,
  { badge: string; dot: string }
> = {
  Low: {
    badge: "border-slate-600/50 bg-slate-700/10 text-slate-400",
    dot: "bg-slate-500",
  },
  Medium: {
    badge: "border-slate-600/50 bg-slate-700/10 text-slate-300",
    dot: "bg-amber-400",
  },
  High: {
    badge: "border-slate-600/50 bg-slate-700/10 text-slate-300",
    dot: "bg-rose-400",
  },
};

export type TargetCompanyDraft = {
  applicationSeason: string;
  company: string;
  notes: string;
  priorityLevel: PriorityLevel;
  roleType: RoleType;
};

function createTargetCompanyId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `target-company-${Date.now()}`;
}

export function createEmptyTargetCompanyDraft(): TargetCompanyDraft {
  return {
    applicationSeason: "",
    company: "",
    notes: "",
    priorityLevel: "Medium",
    roleType: "SWE",
  };
}

export function targetCompanyToDraft(
  targetCompany: TargetCompany,
): TargetCompanyDraft {
  return {
    applicationSeason: targetCompany.applicationSeason,
    company: targetCompany.company,
    notes: targetCompany.notes,
    priorityLevel: targetCompany.priorityLevel,
    roleType: targetCompany.roleType,
  };
}

export function createTargetCompanyFromDraft(
  draft: TargetCompanyDraft,
): TargetCompany {
  const timestamp = new Date().toISOString();

  return {
    id: createTargetCompanyId(),
    applicationSeason: draft.applicationSeason.trim(),
    company: draft.company.trim(),
    notes: draft.notes.trim(),
    priorityLevel: draft.priorityLevel,
    roleType: draft.roleType,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function updateTargetCompanyFromDraft(
  targetCompany: TargetCompany,
  draft: TargetCompanyDraft,
): TargetCompany {
  return {
    ...targetCompany,
    applicationSeason: draft.applicationSeason.trim(),
    company: draft.company.trim(),
    notes: draft.notes.trim(),
    priorityLevel: draft.priorityLevel,
    roleType: draft.roleType,
    updatedAt: new Date().toISOString(),
  };
}
