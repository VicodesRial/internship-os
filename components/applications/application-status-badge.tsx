import { applicationStatusThemeClasses } from "@/lib/applications";
import type { ApplicationStatus } from "@/lib/types";

type ApplicationStatusBadgeProps = {
  status: ApplicationStatus;
};

export function ApplicationStatusBadge({
  status,
}: ApplicationStatusBadgeProps) {
  const theme = applicationStatusThemeClasses[status];

  return (
    <span
      className={`font-pixel-label inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 text-[7px] uppercase leading-3 tracking-[0.03em] ${theme.badge}`}
    >
      <span className={`h-1.5 w-1.5 ${theme.dot}`} />
      {status}
    </span>
  );
}
