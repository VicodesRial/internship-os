"use client";

import Link from "next/link";

import { ApplicationStatusBadge } from "@/components/applications/application-status-badge";
import { useAppData } from "@/components/providers/app-data-provider";
import { useAuth } from "@/components/providers/auth-provider";
import { Icon, type IconName } from "@/components/ui/icon";
import type { CapturePreset } from "@/lib/capture-presets";
import {
  formatDateLabel,
  formatRelativeDayLabel,
  getApplicationsOverTime,
  getDashboardMetrics,
  getStatusDistribution,
  getUpcomingDeadlines,
  getUpcomingFollowUps,
} from "@/lib/dashboard";

function CardHeader({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div><p className="command-label">// {eyebrow.replaceAll(" ", "_")}</p><h3 className="font-pixel-heading mt-1 text-[13px] uppercase tracking-[0.02em] text-[var(--text)]">{title}</h3></div>
      {action}
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="grid min-h-24 place-items-center rounded-sm border border-dashed border-[var(--border)] bg-[var(--card-soft)] p-4 text-center font-mono text-[10px] uppercase leading-5 tracking-wide text-[var(--muted)]">{children}</div>;
}

export function DashboardOverview({ presentationPreset }: { presentationPreset?: CapturePreset }) {
  const { data, hasHydrated } = useAppData();
  const { profile, user } = useAuth();
  const metrics = getDashboardMetrics(data.applications);
  const metricMap = new Map(metrics.stats.map((item) => [item.label, item]));
  const deadlines = getUpcomingDeadlines(data.applications);
  const followUps = getUpcomingFollowUps(data.applications);
  const distribution = getStatusDistribution(data.applications);
  const timeline = getApplicationsOverTime(data.applications);
  const latestGoal = [...data.weeklyGoals].sort((a, b) => b.week.localeCompare(a.week))[0];
  const recentApplications = [...data.applications].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 4);
  const firstName = (profile?.display_name || user?.email?.split("@")[0] || "Operator").split(" ")[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const currentDate = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(new Date());
  const focusCount = deadlines.filter((item) => item.daysAway <= 7).length + followUps.filter((item) => item.daysAway <= 7).length;

  if (!hasHydrated && presentationPreset) {
    return <div className="surface-card animate-pulse p-8"><div className="h-7 w-72 rounded-lg bg-slate-200" /><div className="mt-4 h-4 w-96 max-w-full rounded bg-slate-100" /></div>;
  }

  const metricCards: { label: string; source: string; detail: string; icon: IconName }[] = [
    { label: "Total applications", source: "Total applications", detail: "All tracked roles", icon: "apps" },
    { label: "Active", source: "Applied", detail: "Currently in motion", icon: "goals" },
    { label: "Interviews", source: "Interviews", detail: "Across all stages", icon: "calendar" },
    { label: "Offers", source: "Offers", detail: "Keep the momentum", icon: "building" },
    { label: "Response rate", source: "Response rate", detail: "From submitted roles", icon: "chart" },
  ];

  return (
    <section className="space-y-4">
      <section className="command-panel overflow-hidden px-4 py-4 sm:px-5">
        <div className="absolute right-4 top-3 font-mono text-[8px] uppercase tracking-[0.18em] text-[#506177]">OPS_BRIEF / LIVE</div>
        <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="command-label">MISSION_CONTROL // {currentDate}</p>
            <h1 className="font-pixel-display mt-1.5 text-xl uppercase tracking-[-0.02em] text-[var(--text)] sm:text-2xl">{greeting}, {firstName}</h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[var(--muted)]">{focusCount > 0 ? `${focusCount} operation${focusCount === 1 ? "" : "s"} require attention this week.` : "All tracked operations are within mission parameters."}</p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link href="/weekly-goals" className="command-button">Goal Log</Link>
            <Link href="/applications?new=1" className="command-button border-[var(--accent)] bg-[#234e78] text-white"><Icon name="plus" className="h-3.5 w-3.5" />New Mission</Link>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-5">
        {metricCards.map((card) => (
          <article key={card.label} className="surface-card p-3.5 transition-transform hover:-translate-y-px">
            <div className="flex items-center justify-between"><span className="font-pixel-label text-[8px] uppercase tracking-[0.04em] text-[var(--muted)]">{card.label}</span><Icon name={card.icon} className="h-3.5 w-3.5 text-[var(--accent)]" /></div>
            <div className="mt-3 flex items-end justify-between gap-2"><p className="font-mono text-2xl font-semibold tracking-[-0.04em] text-[var(--text)]">{metricMap.get(card.source)?.value ?? "0"}</p><span className="mb-1 h-1.5 w-1.5 bg-[var(--success)]" /></div>
            <p className="mt-1 font-mono text-[8px] uppercase tracking-wide text-[#586679]">{card.detail}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
        <section className="surface-card p-4">
          <CardHeader eyebrow="Today’s focus" title="The next moves that matter" action={<Link href="/applications" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">View all</Link>} />
          <div className="mt-5 space-y-2">
            {[...deadlines.slice(0, 2), ...followUps.slice(0, 2)].slice(0, 4).map((item) => (
              <div key={item.id} className="group flex items-start gap-3 rounded-sm border border-transparent px-2 py-2 transition hover:border-[var(--border)] hover:bg-[var(--accent-soft)]">
                <span className="mt-1 h-2 w-2 shrink-0 rotate-45 border border-[var(--accent)]" />
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{item.label === "Deadline" ? `Submit ${item.role}` : `Follow up with ${item.company}`}</p><p className="mt-1 truncate text-xs text-slate-500">{item.company} · {item.role}</p></div>
                <span className="border border-[var(--border)] bg-[var(--card-soft)] px-2 py-1 font-mono text-[9px] uppercase text-[var(--warning)]">{formatRelativeDayLabel(item.daysAway)}</span>
              </div>
            ))}
            {deadlines.length + followUps.length === 0 ? <EmptyState>No urgent deadlines or follow-ups. Add dates to applications to build your daily focus list.</EmptyState> : null}
          </div>
        </section>

        <section className="surface-card p-4">
          <CardHeader eyebrow="Pipeline" title="Application stages" action={<span className="text-xs text-slate-400">{metrics.totalApplications} total</span>} />
          <div className="mt-6 space-y-4">
            {distribution.slice(0, 6).map((item) => (
              <div key={item.status}><div className="mb-2 flex items-center justify-between text-xs"><span className="font-medium text-slate-600 dark:text-slate-300">{item.status}</span><span className="text-slate-400">{item.count}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.06]"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.max(item.percentage, 3)}%` }} /></div></div>
            ))}
            {distribution.length === 0 ? <EmptyState>Your stage distribution will appear once applications are added.</EmptyState> : null}
          </div>
        </section>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)]">
        <section className="surface-card p-4">
          <CardHeader eyebrow="Activity" title="Application momentum" action={<span className="text-xs text-slate-400">Recent months</span>} />
          {timeline.length ? <div className="mt-8 flex h-52 items-end gap-3 border-b border-slate-200 px-1 dark:border-white/10">{timeline.map((item) => { const max = Math.max(...timeline.map((point) => point.appliedCount), 1); return <div key={item.label} className="flex h-full min-w-0 flex-1 flex-col justify-end gap-2"><span className="text-center text-xs font-medium text-slate-400">{item.appliedCount}</span><div className="mx-auto w-full max-w-12 rounded-t-lg bg-indigo-500/85 transition-[height]" style={{ height: `${Math.max((item.appliedCount / max) * 75, 6)}%` }} /><span className="pb-3 text-center text-[10px] font-medium uppercase tracking-wide text-slate-400">{item.label}</span></div>; })}</div> : <div className="mt-5"><EmptyState>Add application dates to see momentum over time.</EmptyState></div>}
        </section>

        <section className="surface-card p-4">
          <CardHeader eyebrow="Weekly goals" title="Execution progress" action={<Link href="/weekly-goals" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Manage</Link>} />
          {latestGoal ? <div className="mt-6 space-y-5">{[
            ["Applications", latestGoal.applicationsCompleted, latestGoal.applicationGoal],
            ["Networking", latestGoal.networkingCompleted, latestGoal.networkingGoal],
            ["LeetCode", latestGoal.leetCodeCompleted, latestGoal.leetCodeGoal],
          ].map(([label, completed, goal]) => { const percent = Number(goal) === 0 ? 0 : Math.min((Number(completed) / Number(goal)) * 100, 100); return <div key={String(label)}><div className="mb-2 flex justify-between text-sm"><span className="font-medium text-slate-700 dark:text-slate-300">{label}</span><span className="text-slate-400">{completed} / {goal}</span></div><div className="h-2 rounded-full bg-slate-100 dark:bg-white/[0.06]"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${percent}%` }} /></div></div>; })}</div> : <div className="mt-5"><EmptyState>Create a weekly goal to make your progress visible here.</EmptyState></div>}
        </section>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="surface-card p-5 sm:p-6 dark:border-white/10 dark:bg-[var(--card)]"><CardHeader eyebrow="Upcoming" title="Deadlines" /><div className="mt-5 space-y-2">{deadlines.slice(0, 4).map((item) => <div key={item.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 dark:border-white/[0.06]"><span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-400/10"><Icon name="calendar" className="h-[18px] w-[18px]" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{item.company}</p><p className="truncate text-xs text-slate-500">{item.role}</p></div><div className="text-right"><p className="text-sm font-medium">{formatDateLabel(item.date)}</p><p className="text-[11px] text-slate-400">{formatRelativeDayLabel(item.daysAway)}</p></div></div>)}{deadlines.length === 0 ? <EmptyState>No upcoming deadlines.</EmptyState> : null}</div></section>
        <section className="surface-card p-5 sm:p-6 dark:border-white/10 dark:bg-[var(--card)]"><CardHeader eyebrow="Recent activity" title="Latest updates" /><div className="mt-5 space-y-2">{recentApplications.map((application) => <div key={application.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 dark:border-white/[0.06]"><span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-xs font-semibold text-slate-600 dark:bg-white/[0.06] dark:text-slate-300">{application.company.slice(0, 2).toUpperCase()}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{application.company}</p><p className="truncate text-xs text-slate-500">{application.role}</p></div><ApplicationStatusBadge status={application.status} /></div>)}{recentApplications.length === 0 ? <EmptyState>Application updates will appear here.</EmptyState> : null}</div></section>
      </div>
    </section>
  );
}
