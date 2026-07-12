import { priorityThemeClasses } from "@/lib/target-companies";
import type { PriorityLevel } from "@/lib/types";

type PriorityBadgeProps = {
  priority: PriorityLevel;
};

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const theme = priorityThemeClasses[priority];

  return (
    <span
      className={`font-pixel-label inline-flex items-center gap-1.5 rounded-sm border border-slate-600/50 bg-slate-700/10 px-2 py-1 text-[7px] uppercase tracking-[0.03em] text-slate-300 ${theme.badge}`}
    >
      <span className={`h-1.5 w-1.5 ${theme.dot}`} />
      {priority}
    </span>
  );
}
