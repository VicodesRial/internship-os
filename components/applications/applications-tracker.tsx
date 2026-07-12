"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { ApplicationFormModal } from "@/components/applications/application-form-modal";
import { ApplicationStatusBadge } from "@/components/applications/application-status-badge";
import { useAppData } from "@/components/providers/app-data-provider";
import {
  applyApplicationFilters,
  applicationStatusOptions,
  applicationToDraft,
  createApplicationFromDraft,
  formatApplicationDate,
  interestLevelOptions,
  updateApplicationFromDraft,
  type ApplicationDraft,
  type ApplicationFilters,
  type ApplicationSortOption,
} from "@/lib/applications";
import type { Application } from "@/lib/types";

const inputClassName =
  "w-full rounded-sm border border-slate-200 bg-white px-3 py-2.5 text-xs text-ink-900 shadow-sm outline-none transition placeholder:text-ink-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100";
const selectClassName =
  "rounded-sm border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-ink-700 shadow-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100";
const secondaryButtonClassName =
  "rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-ink-700 transition hover:border-slate-300 hover:bg-slate-100";

const sortOptions: { label: string; value: ApplicationSortOption }[] = [
  { label: "Recently updated", value: "updated-desc" },
  { label: "Deadline first", value: "deadline-asc" },
  { label: "Date applied (newest)", value: "date-applied-desc" },
];

function InterestMeter({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => (
        <span
          key={index}
          className={`h-2.5 w-4 rounded-full ${
            index < level ? "bg-blue-500" : "bg-slate-200"
          }`}
        />
      ))}
    </div>
  );
}

function EmptyApplicationsState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white/70 p-10 text-center shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
        Applications
      </p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink-900">
        No applications tracked yet
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-ink-600">
        Add your first internship application to track status changes, follow-ups,
        deadlines, recruiter context, and notes in one place.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="mt-6 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        Add application
      </button>
    </div>
  );
}

function LoadingApplicationsState() {
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
          <div className="h-12 w-[160px] rounded-full bg-slate-900" />
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

function ApplicationSummary({
  active,
  followUps,
  interviews,
  total,
}: {
  active: number;
  followUps: number;
  interviews: number;
  total: number;
}) {
  const summaryItems = [
    { label: "Tracked", value: total },
    { label: "Active", value: active },
    { label: "Interviewing", value: interviews },
    { label: "Follow-ups", value: followUps },
  ];

  return (
    <div className="command-panel grid grid-cols-2 gap-px overflow-hidden bg-[var(--border)] p-px sm:grid-cols-4">
      {summaryItems.map((item) => (
        <div
          key={item.label}
          className="bg-[var(--card-soft)] px-3 py-2.5"
        >
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            {item.label}
          </p>
          <p className="mt-1 font-mono text-xl font-semibold tracking-tight text-[var(--text)]">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function NoResultsState({ onReset }: { onReset: () => void }) {
  return (
    <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white/70 p-10 text-center shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
        No Matches
      </p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink-900">
        No applications match these filters
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-ink-600">
        Try resetting the search, status, or interest filters to see more
        application records.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-6 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-ink-700 transition hover:border-slate-300 hover:bg-slate-100"
      >
        Reset filters
      </button>
    </div>
  );
}

function ApplicationFiltersPanel({
  filters,
  onChange,
  onReset,
  totalCount,
  visibleCount,
}: {
  filters: ApplicationFilters;
  onChange: <K extends keyof ApplicationFilters>(
    key: K,
    value: ApplicationFilters[K],
  ) => void;
  onReset: () => void;
  totalCount: number;
  visibleCount: number;
}) {
  return (
    <section className="command-panel p-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="command-label">QUERY_CONSOLE</p>
          <h3 className="font-pixel-heading mt-1 text-xs uppercase tracking-[0.02em] text-[var(--text)]">Filter mission database</h3>
          <p className="mt-2 text-sm leading-6 text-ink-600">
            Showing {visibleCount} of {totalCount} applications
          </p>
        </div>

        <button
          type="button"
          onClick={onReset}
          className={secondaryButtonClassName}
        >
          Reset filters
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-ink-700">
            Search company or role
          </span>
          <input
            value={filters.search}
            onChange={(event) => onChange("search", event.target.value)}
            className={inputClassName}
            placeholder="Search Stripe or Backend Engineer"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-ink-700">
            Status
          </span>
          <select
            value={filters.status}
            onChange={(event) =>
              onChange("status", event.target.value as ApplicationFilters["status"])
            }
            className={inputClassName}
          >
            <option value="all">All statuses</option>
            {applicationStatusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-ink-700">
            Interest level
          </span>
          <select
            value={filters.interestLevel}
            onChange={(event) =>
              onChange(
                "interestLevel",
                event.target.value === "all"
                  ? "all"
                  : (Number(event.target.value) as ApplicationFilters["interestLevel"]),
              )
            }
            className={inputClassName}
          >
            <option value="all">All levels</option>
            {interestLevelOptions.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-ink-700">
            Sort by
          </span>
          <select
            value={filters.sortBy}
            onChange={(event) =>
              onChange("sortBy", event.target.value as ApplicationSortOption)
            }
            className={inputClassName}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}

function ApplicationCards({
  applications,
  onDelete,
  onEdit,
  onStatusChange,
  viewMode,
}: {
  applications: Application[];
  onDelete: (application: Application) => void;
  onEdit: (application: Application) => void;
  onStatusChange: (applicationId: string, status: Application["status"]) => void;
  viewMode: "table" | "cards";
}) {
  return (
    <div className={`${viewMode === "cards" ? "grid" : "grid xl:hidden"} gap-4 md:grid-cols-2` }>
      {applications.map((application) => (
        <article
          key={application.id}
          className="rounded-[1.25rem] border border-slate-200 bg-white p-5 shadow-sm transition-transform hover:-translate-y-0.5"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-xl font-semibold tracking-tight text-ink-900">
                {application.company}
              </h3>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <ApplicationStatusBadge status={application.status} />
                <p className="text-sm text-ink-600">{application.role}</p>
              </div>
            </div>

            <select
              value={application.status}
              onChange={(event) =>
                onStatusChange(
                  application.id,
                  event.target.value as Application["status"],
                )
              }
              className={selectClassName}
            >
              {applicationStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                Applied
              </p>
              <p className="mt-2 text-sm font-medium text-ink-900">
                {formatApplicationDate(application.dateApplied)}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                Deadline
              </p>
              <p className="mt-2 text-sm font-medium text-ink-900">
                {formatApplicationDate(application.deadline)}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                Contact
              </p>
              <p className="mt-2 text-sm font-medium text-ink-900">
                {application.recruiterContact || "Not set"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                Interest
              </p>
              <div className="mt-3">
                <InterestMeter level={application.interestLevel} />
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onEdit(application)}
              className={secondaryButtonClassName}
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => onDelete(application)}
              className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100"
            >
              Delete
            </button>
            {application.applicationLink ? (
              <a
                href={application.applicationLink}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
              >
                Open link
              </a>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}

function ApplicationsTable({
  applications,
  onDelete,
  onEdit,
  onStatusChange,
  viewMode,
}: {
  applications: Application[];
  onDelete: (application: Application) => void;
  onEdit: (application: Application) => void;
  onStatusChange: (applicationId: string, status: Application["status"]) => void;
  viewMode: "table" | "cards";
}) {
  return (
    <div className={`${viewMode === "cards" ? "hidden" : "hidden xl:block"} min-w-0 overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white shadow-sm`}>
      <div className="overflow-x-auto">
        <table className="min-w-[1600px] divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs font-semibold uppercase tracking-[0.16em] text-ink-500">
              <th className="px-4 py-4">Company</th>
              <th className="px-4 py-4">Role</th>
              <th className="px-4 py-4">Location</th>
              <th className="px-4 py-4">Applied</th>
              <th className="px-4 py-4">Deadline</th>
              <th className="px-4 py-4">Status</th>
              <th className="px-4 py-4">OA</th>
              <th className="px-4 py-4">Interview</th>
              <th className="px-4 py-4">Contact</th>
              <th className="px-4 py-4">Referral</th>
              <th className="px-4 py-4">Follow-up</th>
              <th className="px-4 py-4">Resume</th>
              <th className="px-4 py-4">Interest</th>
              <th className="px-4 py-4">Notes</th>
              <th className="px-4 py-4">Link</th>
              <th className="sticky right-0 bg-slate-50 px-4 py-4 shadow-[-10px_0_20px_-16px_rgba(15,23,42,0.3)]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {applications.map((application) => (
              <tr key={application.id} className="align-top text-sm text-ink-700">
                <td className="px-4 py-4 font-semibold text-ink-900">
                  <div className="min-w-[160px]">
                    <div className="font-semibold">{application.company}</div>
                    <div className="mt-2">
                      <ApplicationStatusBadge status={application.status} />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">{application.role}</td>
                <td className="px-4 py-4">{application.location || "Not set"}</td>
                <td className="px-4 py-4">
                  {formatApplicationDate(application.dateApplied)}
                </td>
                <td className="px-4 py-4">
                  {formatApplicationDate(application.deadline)}
                </td>
                <td className="px-4 py-4">
                  <select
                    value={application.status}
                    onChange={(event) =>
                      onStatusChange(
                        application.id,
                        event.target.value as Application["status"],
                      )
                    }
                    className={selectClassName}
                  >
                    {applicationStatusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-4">{application.oaReceived ? "Yes" : "-"}</td>
                <td className="px-4 py-4">{application.interviewStage}</td>
                <td className="px-4 py-4">
                  <div className="max-w-[140px]">
                    {application.recruiterContact || "Not set"}
                  </div>
                </td>
                <td className="px-4 py-4">{application.referralStatus}</td>
                <td className="px-4 py-4">
                  {formatApplicationDate(application.followUpDate)}
                </td>
                <td className="px-4 py-4">
                  {application.resumeVersion || "Not set"}
                </td>
                <td className="px-4 py-4">
                  <InterestMeter level={application.interestLevel} />
                </td>
                <td className="max-w-[260px] px-4 py-4 text-ink-600">
                  <p className="line-clamp-3 whitespace-pre-wrap">
                    {application.notes || "No notes"}
                  </p>
                </td>
                <td className="px-4 py-4">
                  {application.applicationLink ? (
                    <a
                      href={application.applicationLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-semibold text-blue-700 hover:text-blue-800"
                    >
                      View
                    </a>
                  ) : (
                    "Not set"
                  )}
                </td>
                <td className="sticky right-0 bg-white px-4 py-4 shadow-[-10px_0_20px_-16px_rgba(15,23,42,0.2)]">
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(application)}
                      className={secondaryButtonClassName}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(application)}
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

export function ApplicationsTracker() {
  const router = useRouter();
  const {
    applicationError,
    applicationLoadError,
    createApplication,
    data,
    deleteApplication,
    hasHydrated,
    isApplicationMutating,
    updateApplication,
    updateApplicationStatus,
  } = useAppData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [editingApplicationId, setEditingApplicationId] = useState<string | null>(null);
  const [filters, setFilters] = useState<ApplicationFilters>({
    interestLevel: "all",
    search: "",
    sortBy: "updated-desc",
    status: "all",
  });

  const applications = useMemo(
    () => applyApplicationFilters(data.applications, filters),
    [data.applications, filters],
  );
  const totalApplications = data.applications.length;
  const activeApplications = data.applications.filter(
    (application) => !["Offer", "Rejected", "Withdrawn"].includes(application.status),
  ).length;
  const interviewingApplications = data.applications.filter(
    (application) => application.status === "Interview",
  ).length;
  const followUpApplications = data.applications.filter(
    (application) => application.followUpDate,
  ).length;

  const editingApplication =
    editingApplicationId === null
      ? null
      : data.applications.find((application) => application.id === editingApplicationId) ??
        null;
  const modalInitialValue = editingApplication
    ? applicationToDraft(editingApplication)
    : null;

  function openCreateModal() {
    setEditingApplicationId(null);
    setIsModalOpen(true);
  }

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("new") === "1") {
      setEditingApplicationId(null);
      setIsModalOpen(true);
    }
  }, []);

  function openEditModal(application: Application) {
    setEditingApplicationId(application.id);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingApplicationId(null);
  }

  async function handleSubmit(draft: ApplicationDraft) {
    let didSave: boolean;
    if (editingApplication) {
      didSave = await updateApplication(
        updateApplicationFromDraft(editingApplication, draft),
      );
    } else {
      didSave = await createApplication(createApplicationFromDraft(draft));
    }

    if (didSave) closeModal();
  }

  function handleDelete(application: Application) {
    const confirmed = window.confirm(
      `Delete the ${application.role} application at ${application.company}?`,
    );

    if (!confirmed) {
      return;
    }

    deleteApplication(application.id);
  }

  function updateFilter<K extends keyof ApplicationFilters>(
    key: K,
    value: ApplicationFilters[K],
  ) {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [key]: value,
    }));
  }

  function resetFilters() {
    setFilters({
      interestLevel: "all",
      search: "",
      sortBy: "updated-desc",
      status: "all",
    });
  }

  if (!hasHydrated) {
    return <LoadingApplicationsState />;
  }

  return (
    <section className="min-w-0 space-y-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <p className="command-label">MODULE_02 // MISSION_QUEUE</p>
          <h2 className="font-pixel-display mt-1 text-xl uppercase tracking-tight text-ink-900">
            Mission Queue
          </h2>
          <p className="mt-3 max-w-3xl text-base leading-7 text-ink-600">
            Active internship operations and deployment status.
          </p>
        </div>

        <div className="shrink-0 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <button type="button" onClick={() => setViewMode("table")} className={`rounded-sm px-3 py-2 font-mono text-[9px] font-semibold uppercase tracking-wider transition ${viewMode === "table" ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "text-[var(--muted)]"}`}>Table</button>
            <button type="button" onClick={() => setViewMode("cards")} className={`rounded-sm px-3 py-2 font-mono text-[9px] font-semibold uppercase tracking-wider transition ${viewMode === "cards" ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "text-[var(--muted)]"}`}>Cards</button>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            disabled={isApplicationMutating}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            New mission
          </button>
        </div>
      </div>

      <ApplicationSummary
        total={totalApplications}
        active={activeApplications}
        interviews={interviewingApplications}
        followUps={followUpApplications}
      />

      {applicationError ? (
        <div role="alert" className="rounded-sm border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-300">
          {applicationError} Your previous view has been restored.
        </div>
      ) : null}

      {applicationLoadError ? (
        <div className="command-panel p-5 text-center">
          <p className="command-label">DATABASE_LINK_ERROR</p>
          <h3 className="font-pixel-heading mt-2 text-sm uppercase text-[var(--text)]">
            Unable to load applications
          </h3>
          <p className="mt-2 text-sm text-[var(--muted)]">{applicationLoadError}</p>
          <button type="button" onClick={() => router.refresh()} className="command-button mt-4">
            Retry connection
          </button>
        </div>
      ) : totalApplications === 0 ? (
        <EmptyApplicationsState onCreate={openCreateModal} />
      ) : (
        <>
          <ApplicationFiltersPanel
            filters={filters}
            onChange={updateFilter}
            onReset={resetFilters}
            totalCount={totalApplications}
            visibleCount={applications.length}
          />

          {applications.length === 0 ? (
            <NoResultsState onReset={resetFilters} />
          ) : (
            <>
              <ApplicationsTable
                applications={applications}
                onDelete={handleDelete}
                onEdit={openEditModal}
                onStatusChange={updateApplicationStatus}
                viewMode={viewMode}
              />
              <ApplicationCards
                applications={applications}
                onDelete={handleDelete}
                onEdit={openEditModal}
                onStatusChange={updateApplicationStatus}
                viewMode={viewMode}
              />
            </>
          )}
        </>
      )}

      <ApplicationFormModal
        initialValue={modalInitialValue}
        isOpen={isModalOpen}
        isSubmitting={isApplicationMutating}
        mode={editingApplication ? "edit" : "create"}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
    </section>
  );
}
