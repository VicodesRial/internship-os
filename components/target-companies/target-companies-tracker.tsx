"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useAppData } from "@/components/providers/app-data-provider";
import { PriorityBadge } from "@/components/target-companies/priority-badge";
import { TargetCompanyFormModal } from "@/components/target-companies/target-company-form-modal";
import {
  createTargetCompanyFromDraft,
  targetCompanyToDraft,
  updateTargetCompanyFromDraft,
  type TargetCompanyDraft,
} from "@/lib/target-companies";
import type { TargetCompany } from "@/lib/types";

function EmptyTargetCompaniesState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white/70 p-10 text-center shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
        Target Companies
      </p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink-900">
        No target companies added yet
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-ink-600">
        Build a focused company shortlist so you can prioritize roles, recruiting
        seasons, and outreach effort.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="mt-6 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        Add target company
      </button>
    </div>
  );
}

function LoadingTargetCompaniesState() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl">
          <div className="h-4 w-40 rounded-full bg-slate-200" />
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

function TargetCompaniesSummary({
  highPriority,
  total,
  upcomingSeasons,
}: {
  highPriority: number;
  total: number;
  upcomingSeasons: number;
}) {
  const summaryItems = [
    { label: "Tracked", value: total },
    { label: "High priority", value: highPriority },
    { label: "Seasons listed", value: upcomingSeasons },
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

function TargetCompanyCards({
  onDelete,
  onEdit,
  targetCompanies,
}: {
  onDelete: (targetCompany: TargetCompany) => void;
  onEdit: (targetCompany: TargetCompany) => void;
  targetCompanies: TargetCompany[];
}) {
  return (
    <div className="grid gap-4 xl:hidden">
      {targetCompanies.map((targetCompany) => (
        <article
          key={targetCompany.id}
          className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-xl font-semibold tracking-tight text-ink-900">
                {targetCompany.company}
              </h3>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  {targetCompany.roleType}
                </span>
                <PriorityBadge priority={targetCompany.priorityLevel} />
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                Season or month
              </p>
              <p className="mt-2 text-sm font-medium text-ink-900">
                {targetCompany.applicationSeason || "Not set"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                Priority
              </p>
              <div className="mt-2">
                <PriorityBadge priority={targetCompany.priorityLevel} />
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
              Notes
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink-700">
              {targetCompany.notes || "No notes"}
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onEdit(targetCompany)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-ink-700 transition hover:border-slate-300 hover:bg-slate-100"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => onDelete(targetCompany)}
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

function TargetCompaniesTable({
  onDelete,
  onEdit,
  targetCompanies,
}: {
  onDelete: (targetCompany: TargetCompany) => void;
  onEdit: (targetCompany: TargetCompany) => void;
  targetCompanies: TargetCompany[];
}) {
  return (
    <div className="hidden min-w-0 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm xl:block">
      <div className="overflow-x-auto">
        <table className="min-w-[980px] divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs font-semibold uppercase tracking-[0.16em] text-ink-500">
              <th className="px-4 py-4">Company</th>
              <th className="px-4 py-4">Role type</th>
              <th className="px-4 py-4">Season or month</th>
              <th className="px-4 py-4">Priority</th>
              <th className="px-4 py-4">Notes</th>
              <th className="sticky right-0 bg-slate-50 px-4 py-4 shadow-[-10px_0_20px_-16px_rgba(15,23,42,0.3)]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {targetCompanies.map((targetCompany) => (
              <tr key={targetCompany.id} className="align-top text-sm text-ink-700">
                <td className="px-4 py-4 font-semibold text-ink-900">
                  {targetCompany.company}
                </td>
                <td className="px-4 py-4">
                  <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {targetCompany.roleType}
                  </span>
                </td>
                <td className="px-4 py-4">
                  {targetCompany.applicationSeason || "Not set"}
                </td>
                <td className="px-4 py-4">
                  <PriorityBadge priority={targetCompany.priorityLevel} />
                </td>
                <td className="max-w-[360px] px-4 py-4 text-ink-600">
                  <p className="line-clamp-3 whitespace-pre-wrap">
                    {targetCompany.notes || "No notes"}
                  </p>
                </td>
                <td className="sticky right-0 bg-white px-4 py-4 shadow-[-10px_0_20px_-16px_rgba(15,23,42,0.2)]">
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(targetCompany)}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-ink-700 transition hover:border-slate-300 hover:bg-slate-100"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(targetCompany)}
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

export function TargetCompaniesTracker() {
  const router = useRouter();
  const {
    cloudError,
    createTargetCompany,
    data,
    deleteTargetCompany,
    hasHydrated,
    isCloudMutating,
    moduleLoadErrors,
    updateTargetCompany,
  } = useAppData();
  const [editingTargetCompanyId, setEditingTargetCompanyId] = useState<string | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const targetCompanies = useMemo(
    () =>
      [...data.targetCompanies].sort((left, right) =>
        right.updatedAt.localeCompare(left.updatedAt),
      ),
    [data.targetCompanies],
  );

  const highPriorityCompanies = targetCompanies.filter(
    (targetCompany) => targetCompany.priorityLevel === "High",
  ).length;
  const listedSeasons = new Set(
    targetCompanies
      .map((targetCompany) => targetCompany.applicationSeason.trim())
      .filter(Boolean),
  ).size;

  const editingTargetCompany =
    editingTargetCompanyId === null
      ? null
      : targetCompanies.find(
          (targetCompany) => targetCompany.id === editingTargetCompanyId,
        ) ?? null;
  const modalInitialValue = editingTargetCompany
    ? targetCompanyToDraft(editingTargetCompany)
    : null;

  function openCreateModal() {
    setEditingTargetCompanyId(null);
    setIsModalOpen(true);
  }

  function openEditModal(targetCompany: TargetCompany) {
    setEditingTargetCompanyId(targetCompany.id);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingTargetCompanyId(null);
  }

  async function handleSubmit(draft: TargetCompanyDraft) {
    const succeeded = editingTargetCompany
      ? await updateTargetCompany(
        updateTargetCompanyFromDraft(editingTargetCompany, draft),
      )
      : await createTargetCompany(createTargetCompanyFromDraft(draft));
    if (succeeded) closeModal();
  }

  async function handleDelete(targetCompany: TargetCompany) {
    const confirmed = window.confirm(
      `Delete ${targetCompany.company} from your target companies list?`,
    );

    if (!confirmed) {
      return;
    }

    await deleteTargetCompany(targetCompany.id);
  }

  if (!hasHydrated) {
    return <LoadingTargetCompaniesState />;
  }

  return (
    <section className="min-w-0 space-y-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <p className="command-label">MODULE_03 // TARGET_DATABASE</p>
          <h2 className="font-pixel-display mt-1 text-xl uppercase tracking-tight text-ink-900">
            Target Database
          </h2>
          <p className="mt-3 max-w-3xl text-base leading-7 text-ink-600">
            Track priority companies, role focus, and recruiting seasons so your
            application strategy stays intentional instead of reactive.
          </p>
        </div>

        <div className="shrink-0 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={openCreateModal}
            disabled={isCloudMutating}
            className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Add target
          </button>
        </div>
      </div>

      {moduleLoadErrors.targetCompanies ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {moduleLoadErrors.targetCompanies} <button type="button" className="font-semibold underline" onClick={() => router.refresh()}>Retry</button>
        </div>
      ) : cloudError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{cloudError} Your previous data was restored.</div>
      ) : null}

      <TargetCompaniesSummary
        total={targetCompanies.length}
        highPriority={highPriorityCompanies}
        upcomingSeasons={listedSeasons}
      />

      {targetCompanies.length === 0 ? (
        <EmptyTargetCompaniesState onCreate={openCreateModal} />
      ) : (
        <>
          <TargetCompaniesTable
            targetCompanies={targetCompanies}
            onDelete={handleDelete}
            onEdit={openEditModal}
          />
          <TargetCompanyCards
            targetCompanies={targetCompanies}
            onDelete={handleDelete}
            onEdit={openEditModal}
          />
        </>
      )}

      <TargetCompanyFormModal
        initialValue={modalInitialValue}
        isOpen={isModalOpen}
        isSubmitting={isCloudMutating}
        mode={editingTargetCompany ? "edit" : "create"}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
    </section>
  );
}
