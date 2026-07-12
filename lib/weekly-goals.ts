import type { WeeklyGoal } from "@/lib/types";

export type WeeklyGoalDraft = {
  applicationGoal: number;
  applicationsCompleted: number;
  leetCodeCompleted: number;
  leetCodeGoal: number;
  networkingCompleted: number;
  networkingGoal: number;
  week: string;
};

function createWeeklyGoalId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `weekly-goal-${Date.now()}`;
}

function normalizeCount(value: number) {
  return Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
}

export function getCurrentIsoWeekLabel(referenceDate = new Date()) {
  const date = new Date(referenceDate);
  date.setHours(0, 0, 0, 0);

  const day = date.getDay() || 7;
  date.setDate(date.getDate() + 4 - day);

  const yearStart = new Date(date.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(
    ((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );

  return `${date.getFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
}

export function createEmptyWeeklyGoalDraft(): WeeklyGoalDraft {
  return {
    applicationGoal: 0,
    applicationsCompleted: 0,
    leetCodeCompleted: 0,
    leetCodeGoal: 0,
    networkingCompleted: 0,
    networkingGoal: 0,
    week: "",
  };
}

export function weeklyGoalToDraft(goal: WeeklyGoal): WeeklyGoalDraft {
  return {
    applicationGoal: goal.applicationGoal,
    applicationsCompleted: goal.applicationsCompleted,
    leetCodeCompleted: goal.leetCodeCompleted,
    leetCodeGoal: goal.leetCodeGoal,
    networkingCompleted: goal.networkingCompleted,
    networkingGoal: goal.networkingGoal,
    week: goal.week,
  };
}

export function createWeeklyGoalFromDraft(draft: WeeklyGoalDraft): WeeklyGoal {
  const timestamp = new Date().toISOString();

  return {
    id: createWeeklyGoalId(),
    applicationGoal: normalizeCount(draft.applicationGoal),
    applicationsCompleted: normalizeCount(draft.applicationsCompleted),
    createdAt: timestamp,
    leetCodeCompleted: normalizeCount(draft.leetCodeCompleted),
    leetCodeGoal: normalizeCount(draft.leetCodeGoal),
    networkingCompleted: normalizeCount(draft.networkingCompleted),
    networkingGoal: normalizeCount(draft.networkingGoal),
    updatedAt: timestamp,
    week: draft.week.trim(),
  };
}

export function updateWeeklyGoalFromDraft(
  goal: WeeklyGoal,
  draft: WeeklyGoalDraft,
): WeeklyGoal {
  return {
    ...goal,
    applicationGoal: normalizeCount(draft.applicationGoal),
    applicationsCompleted: normalizeCount(draft.applicationsCompleted),
    leetCodeCompleted: normalizeCount(draft.leetCodeCompleted),
    leetCodeGoal: normalizeCount(draft.leetCodeGoal),
    networkingCompleted: normalizeCount(draft.networkingCompleted),
    networkingGoal: normalizeCount(draft.networkingGoal),
    updatedAt: new Date().toISOString(),
    week: draft.week.trim(),
  };
}

export function getGoalProgress(completed: number, goal: number) {
  if (goal <= 0) {
    return 0;
  }

  return Math.min((completed / goal) * 100, 100);
}
