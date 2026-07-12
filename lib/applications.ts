import type {
  Application,
  ApplicationStatus,
  InterestLevel,
  InterviewStage,
  ReferralStatus,
} from "@/lib/types";

export const applicationStatusOptions: ApplicationStatus[] = [
  "Wishlist",
  "Applied",
  "OA Received",
  "Interview",
  "Offer",
  "Rejected",
  "Withdrawn",
];

export const applicationStatusThemeClasses: Record<
  ApplicationStatus,
  { badge: string; dot: string }
> = {
  Wishlist: {
    badge: "border-slate-600/50 bg-slate-700/10 text-slate-400",
    dot: "bg-slate-500",
  },
  Applied: {
    badge: "border-slate-600/50 bg-slate-700/10 text-slate-300",
    dot: "bg-sky-400",
  },
  "OA Received": {
    badge: "border-slate-600/50 bg-slate-700/10 text-slate-300",
    dot: "bg-amber-400",
  },
  Interview: {
    badge: "border-slate-600/50 bg-slate-700/10 text-slate-300",
    dot: "bg-sky-400",
  },
  Offer: {
    badge: "border-slate-600/50 bg-slate-700/10 text-slate-300",
    dot: "bg-emerald-400",
  },
  Rejected: {
    badge: "border-slate-600/50 bg-slate-700/10 text-slate-400",
    dot: "bg-rose-400",
  },
  Withdrawn: {
    badge: "border-slate-600/50 bg-slate-700/10 text-slate-400",
    dot: "bg-slate-500",
  },
};

export const interviewStageOptions: InterviewStage[] = [
  "None",
  "Recruiter Screen",
  "Technical Interview",
  "Final Round",
  "Completed",
];

export const referralStatusOptions: ReferralStatus[] = [
  "None",
  "Requested",
  "Received",
];

export const interestLevelOptions: InterestLevel[] = [1, 2, 3, 4, 5];

export type ApplicationSortOption =
  | "updated-desc"
  | "deadline-asc"
  | "date-applied-desc";

export type ApplicationFilters = {
  interestLevel: "all" | InterestLevel;
  search: string;
  sortBy: ApplicationSortOption;
  status: "all" | ApplicationStatus;
};

export type ApplicationDraft = {
  company: string;
  role: string;
  location: string;
  applicationLink: string;
  dateApplied: string;
  deadline: string;
  status: ApplicationStatus;
  oaReceived: boolean;
  interviewStage: InterviewStage;
  recruiterContact: string;
  referralStatus: ReferralStatus;
  followUpDate: string;
  resumeVersion: string;
  notes: string;
  interestLevel: InterestLevel;
};

function createApplicationId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `application-${Date.now()}`;
}

function normalizeDateValue(value: string) {
  return value.trim() === "" ? null : value;
}

export function createEmptyApplicationDraft(): ApplicationDraft {
  return {
    company: "",
    role: "",
    location: "",
    applicationLink: "",
    dateApplied: "",
    deadline: "",
    status: "Wishlist",
    oaReceived: false,
    interviewStage: "None",
    recruiterContact: "",
    referralStatus: "None",
    followUpDate: "",
    resumeVersion: "",
    notes: "",
    interestLevel: 3,
  };
}

export function applicationToDraft(application: Application): ApplicationDraft {
  return {
    company: application.company,
    role: application.role,
    location: application.location,
    applicationLink: application.applicationLink,
    dateApplied: application.dateApplied ?? "",
    deadline: application.deadline ?? "",
    status: application.status,
    oaReceived: application.oaReceived,
    interviewStage: application.interviewStage,
    recruiterContact: application.recruiterContact,
    referralStatus: application.referralStatus,
    followUpDate: application.followUpDate ?? "",
    resumeVersion: application.resumeVersion,
    notes: application.notes,
    interestLevel: application.interestLevel,
  };
}

export function createApplicationFromDraft(draft: ApplicationDraft): Application {
  const timestamp = new Date().toISOString();

  return {
    id: createApplicationId(),
    company: draft.company.trim(),
    role: draft.role.trim(),
    location: draft.location.trim(),
    applicationLink: draft.applicationLink.trim(),
    dateApplied: normalizeDateValue(draft.dateApplied),
    deadline: normalizeDateValue(draft.deadline),
    status: draft.status,
    oaReceived: draft.oaReceived,
    interviewStage: draft.interviewStage,
    recruiterContact: draft.recruiterContact.trim(),
    referralStatus: draft.referralStatus,
    followUpDate: normalizeDateValue(draft.followUpDate),
    resumeVersion: draft.resumeVersion.trim(),
    notes: draft.notes.trim(),
    interestLevel: draft.interestLevel,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function updateApplicationFromDraft(
  application: Application,
  draft: ApplicationDraft,
): Application {
  return {
    ...application,
    company: draft.company.trim(),
    role: draft.role.trim(),
    location: draft.location.trim(),
    applicationLink: draft.applicationLink.trim(),
    dateApplied: normalizeDateValue(draft.dateApplied),
    deadline: normalizeDateValue(draft.deadline),
    status: draft.status,
    oaReceived: draft.oaReceived,
    interviewStage: draft.interviewStage,
    recruiterContact: draft.recruiterContact.trim(),
    referralStatus: draft.referralStatus,
    followUpDate: normalizeDateValue(draft.followUpDate),
    resumeVersion: draft.resumeVersion.trim(),
    notes: draft.notes.trim(),
    interestLevel: draft.interestLevel,
    updatedAt: new Date().toISOString(),
  };
}

export function formatApplicationDate(value: string | null) {
  if (!value) {
    return "Not set";
  }

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return value;
  }

  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getDateSortValue(value: string | null, fallback: number) {
  if (!value) {
    return fallback;
  }

  const timestamp = new Date(value).getTime();

  return Number.isNaN(timestamp) ? fallback : timestamp;
}

export function applyApplicationFilters(
  applications: Application[],
  filters: ApplicationFilters,
) {
  const normalizedSearch = filters.search.trim().toLowerCase();

  const filteredApplications = applications.filter((application) => {
    const matchesSearch =
      normalizedSearch === "" ||
      application.company.toLowerCase().includes(normalizedSearch) ||
      application.role.toLowerCase().includes(normalizedSearch);

    const matchesStatus =
      filters.status === "all" || application.status === filters.status;

    const matchesInterest =
      filters.interestLevel === "all" ||
      application.interestLevel === filters.interestLevel;

    return matchesSearch && matchesStatus && matchesInterest;
  });

  return [...filteredApplications].sort((left, right) => {
    if (filters.sortBy === "deadline-asc") {
      const leftDeadline = getDateSortValue(left.deadline, Number.POSITIVE_INFINITY);
      const rightDeadline = getDateSortValue(
        right.deadline,
        Number.POSITIVE_INFINITY,
      );

      if (leftDeadline !== rightDeadline) {
        return leftDeadline - rightDeadline;
      }
    }

    if (filters.sortBy === "date-applied-desc") {
      const leftAppliedDate = getDateSortValue(left.dateApplied, Number.NEGATIVE_INFINITY);
      const rightAppliedDate = getDateSortValue(
        right.dateApplied,
        Number.NEGATIVE_INFINITY,
      );

      if (leftAppliedDate !== rightAppliedDate) {
        return rightAppliedDate - leftAppliedDate;
      }
    }

    return right.updatedAt.localeCompare(left.updatedAt);
  });
}
