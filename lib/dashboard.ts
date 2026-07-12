import type { Application } from "@/lib/types";
import { applicationStatusOptions } from "@/lib/applications";

type DashboardStat = {
  label: string;
  value: string;
  tone: "neutral" | "blue" | "emerald" | "amber" | "rose";
};

export type DashboardMetrics = {
  stats: DashboardStat[];
  totalApplications: number;
};

export type UpcomingItem = {
  id: string;
  company: string;
  role: string;
  date: string;
  daysAway: number;
  status: Application["status"];
  label: string;
};

export type StatusDistributionItem = {
  count: number;
  percentage: number;
  status: Application["status"];
};

export type ApplicationsTimelinePoint = {
  appliedCount: number;
  label: string;
};

const CLOSED_STATUSES: Application["status"][] = ["Offer", "Rejected", "Withdrawn"];

function isApplied(application: Application) {
  return application.dateApplied !== null || application.status !== "Wishlist";
}

function hasInterviewActivity(application: Application) {
  return (
    application.status === "Interview" ||
    application.status === "Offer" ||
    application.interviewStage !== "None"
  );
}

function hasResponse(application: Application) {
  return (
    application.oaReceived ||
    hasInterviewActivity(application) ||
    application.status === "Rejected" ||
    application.status === "Withdrawn"
  );
}

function parseLocalDate(value: string | null) {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function startOfToday() {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

function differenceInDays(date: Date, compareDate: Date) {
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  return Math.round((date.getTime() - compareDate.getTime()) / millisecondsPerDay);
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function isOpenApplication(application: Application) {
  return !CLOSED_STATUSES.includes(application.status);
}

function compareBySoonestDate(left: UpcomingItem, right: UpcomingItem) {
  return left.daysAway - right.daysAway;
}

function createUpcomingItems(
  applications: Application[],
  field: "deadline" | "followUpDate",
  label: string,
) {
  const today = startOfToday();

  return applications
    .filter(isOpenApplication)
    .flatMap((application) => {
      const dateValue = application[field];

      if (!dateValue) {
        return [];
      }

      const parsedDate = parseLocalDate(dateValue);

      if (!parsedDate) {
        return [];
      }

      const daysAway = differenceInDays(parsedDate, today);

      if (daysAway < 0) {
        return [];
      }

      return [
        {
          id: `${field}-${application.id}`,
          company: application.company,
          role: application.role,
          date: dateValue,
          daysAway,
          status: application.status,
          label,
        },
      ];
    })
    .sort(compareBySoonestDate);
}

export function formatDateLabel(value: string) {
  const parsedDate = parseLocalDate(value);

  if (!parsedDate) {
    return value;
  }

  return parsedDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function formatRelativeDayLabel(daysAway: number) {
  if (daysAway === 0) {
    return "Today";
  }

  if (daysAway === 1) {
    return "Tomorrow";
  }

  return `In ${daysAway} days`;
}

export function getDashboardMetrics(applications: Application[]): DashboardMetrics {
  const totalApplications = applications.length;
  const applied = applications.filter(isApplied);
  const oaReceived = applications.filter((application) => application.oaReceived);
  const interviews = applications.filter(hasInterviewActivity);
  const offers = applications.filter((application) => application.status === "Offer");
  const rejections = applications.filter(
    (application) => application.status === "Rejected",
  );
  const responses = applied.filter(hasResponse);

  const responseRate = applied.length === 0 ? 0 : (responses.length / applied.length) * 100;
  const interviewRate =
    applied.length === 0 ? 0 : (interviews.length / applied.length) * 100;

  return {
    totalApplications,
    stats: [
      {
        label: "Total applications",
        value: String(totalApplications),
        tone: "neutral",
      },
      {
        label: "Applied",
        value: String(applied.length),
        tone: "blue",
      },
      {
        label: "OAs received",
        value: String(oaReceived.length),
        tone: "amber",
      },
      {
        label: "Interviews",
        value: String(interviews.length),
        tone: "blue",
      },
      {
        label: "Offers",
        value: String(offers.length),
        tone: "emerald",
      },
      {
        label: "Rejections",
        value: String(rejections.length),
        tone: "rose",
      },
      {
        label: "Response rate",
        value: formatPercent(responseRate),
        tone: "neutral",
      },
      {
        label: "Interview rate",
        value: formatPercent(interviewRate),
        tone: "neutral",
      },
    ],
  };
}

export function getUpcomingDeadlines(applications: Application[]) {
  return createUpcomingItems(applications, "deadline", "Deadline");
}

export function getUpcomingFollowUps(applications: Application[]) {
  return createUpcomingItems(applications, "followUpDate", "Follow-up");
}

export function getStatusDistribution(applications: Application[]): StatusDistributionItem[] {
  const total = applications.length;

  return applicationStatusOptions
    .map((status) => {
      const count = applications.filter((application) => application.status === status).length;

      return {
        count,
        percentage: total === 0 ? 0 : (count / total) * 100,
        status,
      };
    })
    .filter((item) => item.count > 0);
}

export function getApplicationsOverTime(
  applications: Application[],
): ApplicationsTimelinePoint[] {
  const groupedCounts = new Map<string, number>();

  applications.forEach((application) => {
    if (!application.dateApplied) {
      return;
    }

    const parsedDate = parseLocalDate(application.dateApplied);

    if (!parsedDate) {
      return;
    }

    const key = `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, "0")}`;
    groupedCounts.set(key, (groupedCounts.get(key) ?? 0) + 1);
  });

  return [...groupedCounts.entries()]
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([key, appliedCount]) => {
      const [year, month] = key.split("-").map(Number);
      const date = new Date(year, month - 1, 1);

      return {
        appliedCount,
        label: date.toLocaleDateString(undefined, {
          month: "short",
          year: "2-digit",
        }),
      };
    });
}
