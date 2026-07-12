"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useAppData } from "@/components/providers/app-data-provider";
import { WeeklyGoalFormModal } from "@/components/weekly-goals/weekly-goal-form-modal";
import {
  createWeeklyGoalFromDraft,
  getGoalProgress,
  updateWeeklyGoalFromDraft,
  weeklyGoalToDraft,
  type WeeklyGoalDraft,
} from "@/lib/weekly-goals";
import type { WeeklyGoal } from "@/lib/types";

function EmptyWeeklyGoalsState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white/70 p-10 text-center shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
        Weekly Goals
      </p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink-900">
        No weekly goals added yet
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-ink-600">
        Add weekly execution targets so applications, networking, and LeetCode
        practice stay measurable.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="mt-6 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        Add weekly goal
      </button>
    </div>
  );
}

function LoadingWeeklyGoalsState() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl">
          <div className="h-4 w-32 rounded-full bg-slate-200" />
          <div className="mt-4 h-10 w-full max-w-xl rounded-2xl bg-slate-200" />
          <div className="mt-4 h-5 w-full rounded-full bg-slate-100" />
          <div className="mt-2 h-5 w-4/5 rounded-full bg-slate-100" />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="h-[76px] w-[180px] rounded-[1.5rem] border border-slate-200 bg-white/80 shadow-sm" />
          <div className="h-12 w-[180px] rounded-full bg-slate-900" />
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
          >
            <div className="h-3 w-20 rounded-full bg-slate-200" />
            <div className="mt-3 h-8 w-12 rounded-full bg-slate-200" />
          </div>
        ))}
      </div>

      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-16 rounded-2xl border border-slate-100 bg-slate-50"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function WeeklyGoalsSummary({
  activeWeeks,
  total,
  totalApplicationTarget,
}: {
  activeWeeks: number;
  total: number;
  totalApplicationTarget: number;
}) {
  const summaryItems = [
    { label: "Tracked", value: total },
    { label: "Weeks listed", value: activeWeeks },
    { label: "Application target", value: totalApplicationTarget },
  ];

  return (
    <div className="command-panel grid grid-cols-2 gap-px overflow-hidden bg-[var(--border)] p-px sm:grid-cols-3">
      {summaryItems.map((item) => (
        <div
          key={item.label}
          className="bg-[var(--card-soft)] px-3 py-2.5"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
            {item.label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-ink-900">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function ProgressBar({
  completed,
  goal,
  label,
}: {
  completed: number;
  goal: number;
  label: string;
}) {
  const percentage = getGoalProgress(completed, goal);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-ink-700">{label}</p>
        <p className="text-sm font-semibold text-ink-900">
          {completed}/{goal}
        </p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function WeeklyGoalCards({
  goals,
  onDelete,
  onEdit,
}: {
  goals: WeeklyGoal[];
  onDelete: (goal: WeeklyGoal) => void;
  onEdit: (goal: WeeklyGoal) => void;
}) {
  return (
    <div className="grid gap-4 xl:hidden">
      {goals.map((goal) => (
        <article
          key={goal.id}
          className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-xl font-semibold tracking-tight text-ink-900">
                {goal.week}
              </h3>
              <p className="mt-1 text-sm text-ink-600">
                Weekly execution targets across applications, networking, and
                LeetCode
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <ProgressBar
              label="Applications"
              completed={goal.applicationsCompleted}
              goal={goal.applicationGoal}
            />
            <ProgressBar
              label="Networking"
              completed={goal.networkingCompleted}
              goal={goal.networkingGoal}
            />
            <ProgressBar
              label="LeetCode"
              completed={goal.leetCodeCompleted}
              goal={goal.leetCodeGoal}
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onEdit(goal)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-ink-700 transition hover:border-slate-300 hover:bg-slate-100"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => onDelete(goal)}
              className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100"
            >
              Delete
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

function WeeklyGoalsTable({
  goals,
  onDelete,
  onEdit,
}: {
  goals: WeeklyGoal[];
  onDelete: (goal: WeeklyGoal) => void;
  onEdit: (goal: WeeklyGoal) => void;
}) {
  return (
    <div className="hidden min-w-0 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm xl:block">
      <div className="overflow-x-auto">
        <table className="min-w-[1100px] divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs font-semibold uppercase tracking-[0.16em] text-ink-500">
              <th className="px-4 py-4">Week</th>
              <th className="px-4 py-4">Application goal</th>
              <th className="px-4 py-4">Applications completed</th>
              <th className="px-4 py-4">Networking goal</th>
              <th className="px-4 py-4">Networking completed</th>
              <th className="px-4 py-4">LeetCode goal</th>
              <th className="px-4 py-4">LeetCode completed</th>
              <th className="sticky right-0 bg-slate-50 px-4 py-4 shadow-[-10px_0_20px_-16px_rgba(15,23,42,0.3)]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {goals.map((goal) => (
              <tr key={goal.id} className="align-top text-sm text-ink-700">
                <td className="px-4 py-4 font-semibold text-ink-900">{goal.week}</td>
                <td className="px-4 py-4">{goal.applicationGoal}</td>
                <td className="px-4 py-4">{goal.applicationsCompleted}</td>
                <td className="px-4 py-4">{goal.networkingGoal}</td>
                <td className="px-4 py-4">{goal.networkingCompleted}</td>
                <td className="px-4 py-4">{goal.leetCodeGoal}</td>
                <td className="px-4 py-4">{goal.leetCodeCompleted}</td>
                <td className="sticky right-0 bg-white px-4 py-4 shadow-[-10px_0_20px_-16px_rgba(15,23,42,0.2)]">
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(goal)}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-ink-700 transition hover:border-slate-300 hover:bg-slate-100"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(goal)}
                      className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function WeeklyGoalsTracker() {
  const router = useRouter();
  const {
    cloudError,
    createWeeklyGoal,
    data,
    deleteWeeklyGoal,
    hasHydrated,
    isCloudMutating,
    moduleLoadErrors,
    updateWeeklyGoal,
  } = useAppData();
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const goals = useMemo(
    () =>
      [...data.weeklyGoals].sort((left, right) => left.week.localeCompare(right.week)),
    [data.weeklyGoals],
  );

  const totalApplicationTarget = goals.reduce(
    (sum, goal) => sum + goal.applicationGoal,
    0,
  );

  const editingGoal =
    editingGoalId === null ? null : goals.find((goal) => goal.id === editingGoalId) ?? null;
  const modalInitialValue = editingGoal ? weeklyGoalToDraft(editingGoal) : null;

  function openCreateModal() {
    setEditingGoalId(null);
    setIsModalOpen(true);
  }

  function openEditModal(goal: WeeklyGoal) {
    setEditingGoalId(goal.id);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingGoalId(null);
  }

  async function handleSubmit(draft: WeeklyGoalDraft) {
    const succeeded = editingGoal
      ? await updateWeeklyGoal(updateWeeklyGoalFromDraft(editingGoal, draft))
      : await createWeeklyGoal(createWeeklyGoalFromDraft(draft));
    if (succeeded) closeModal();
  }

  async function handleDelete(goal: WeeklyGoal) {
    const confirmed = window.confirm(`Delete weekly goal ${goal.week}?`);

    if (!confirmed) {
      return;
    }

    await deleteWeeklyGoal(goal.id);
  }

  if (!hasHydrated) {
    return <LoadingWeeklyGoalsState />;
  }

  return (
    <section className="min-w-0 space-y-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <p className="command-label">MODULE_05 // MISSION_LOG</p>
          <h2 className="font-pixel-display mt-1 text-xl uppercase tracking-tight text-ink-900">
            Mission Log
          </h2>
          <p className="mt-3 max-w-3xl text-base leading-7 text-ink-600">
            Set weekly targets for applications, networking, and LeetCode so you
            can manage momentum instead of relying on memory.
          </p>
        </div>

        <div className="shrink-0 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={openCreateModal}
            disabled={isCloudMutating}
            className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            New directive
          </button>
        </div>
      </div>

      {moduleLoadErrors.weeklyGoals ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {moduleLoadErrors.weeklyGoals} <button type="button" className="font-semibold underline" onClick={() => router.refresh()}>Retry</button>
        </div>
      ) : cloudError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{cloudError} Your previous data was restored.</div>
      ) : null}

      <WeeklyGoalsSummary
        total={goals.length}
        activeWeeks={goals.length}
        totalApplicationTarget={totalApplicationTarget}
      />

      {goals.length === 0 ? (
        <EmptyWeeklyGoalsState onCreate={openCreateModal} />
      ) : (
        <>
          <WeeklyGoalsTable goals={goals} onDelete={handleDelete} onEdit={openEditModal} />
          <WeeklyGoalCards goals={goals} onDelete={handleDelete} onEdit={openEditModal} />
        </>
      )}

      <WeeklyGoalFormModal
        initialValue={modalInitialValue}
        isOpen={isModalOpen}
        isSubmitting={isCloudMutating}
        mode={editingGoal ? "edit" : "create"}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
    </section>
  );
}
