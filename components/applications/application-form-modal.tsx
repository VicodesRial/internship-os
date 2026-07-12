"use client";

import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useState,
  type FormEvent,
  type ReactElement,
  type ReactNode,
} from "react";

import { useDialogBehavior } from "@/components/ui/use-dialog-behavior";

import {
  applicationStatusOptions,
  createEmptyApplicationDraft,
  type ApplicationDraft,
  interestLevelOptions,
  interviewStageOptions,
  referralStatusOptions,
} from "@/lib/applications";

type ApplicationFormModalProps = {
  initialValue?: ApplicationDraft | null;
  isOpen: boolean;
  isSubmitting?: boolean;
  mode: "create" | "edit";
  onClose: () => void;
  onSubmit: (draft: ApplicationDraft) => Promise<void> | void;
};

type FieldProps = {
  label: string;
  children: ReactNode;
};

function Field({ label, children }: FieldProps) {
  const fieldId = useId();
  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<{ id?: string }>, { id: fieldId })
    : children;

  return (
    <div className="block">
      <label
        htmlFor={fieldId}
        className="mb-2 block text-sm font-medium text-ink-700"
      >
        {label}
      </label>
      {control}
    </div>
  );
}

const inputClassName =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink-900 shadow-sm outline-none transition placeholder:text-ink-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100";

export function ApplicationFormModal({
  initialValue,
  isOpen,
  isSubmitting = false,
  mode,
  onClose,
  onSubmit,
}: ApplicationFormModalProps) {
  const [draft, setDraft] = useState<ApplicationDraft>(createEmptyApplicationDraft);
  const titleId = useId();
  const dialogRef = useDialogBehavior(isOpen, onClose);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setDraft(initialValue ?? createEmptyApplicationDraft());
  }, [initialValue, isOpen]);

  if (!isOpen) {
    return null;
  }

  function updateDraft<K extends keyof ApplicationDraft>(
    key: K,
    value: ApplicationDraft[K],
  ) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      [key]: value,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    onSubmit(draft);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 px-3 py-5">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-5xl rounded-[1.5rem] border border-white/80 bg-slate-50 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5 sm:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-400">
              {mode === "create" ? "New application" : "Edit application"}
            </p>
            <h2
              id={titleId}
              className="mt-2 text-2xl font-semibold tracking-tight text-ink-900"
            >
              {mode === "create"
                ? "Add an application record"
                : "Update application details"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-ink-600 transition hover:border-slate-300 hover:bg-slate-100"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 px-6 py-6 sm:px-8">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="md:col-span-2 xl:col-span-3">
              <h3 className="text-sm font-semibold text-slate-950 dark:text-white">Position information</h3>
              <p className="mt-1 text-xs text-slate-500">Core details about the role and company.</p>
            </div>
            <Field label="Company">
              <input
                required
                value={draft.company}
                onChange={(event) => updateDraft("company", event.target.value)}
                className={inputClassName}
                placeholder="OpenAI"
              />
            </Field>

            <Field label="Role">
              <input
                required
                value={draft.role}
                onChange={(event) => updateDraft("role", event.target.value)}
                className={inputClassName}
                placeholder="Software Engineer Intern"
              />
            </Field>

            <Field label="Location">
              <input
                value={draft.location}
                onChange={(event) => updateDraft("location", event.target.value)}
                className={inputClassName}
                placeholder="San Francisco, CA"
              />
            </Field>

            <Field label="Application link">
              <input
                type="url"
                value={draft.applicationLink}
                onChange={(event) =>
                  updateDraft("applicationLink", event.target.value)
                }
                className={inputClassName}
                placeholder="https://company.com/jobs"
              />
            </Field>

            <div className="mt-3 border-t border-slate-200 pt-5 md:col-span-2 xl:col-span-3 dark:border-white/10">
              <h3 className="text-sm font-semibold text-slate-950 dark:text-white">Status and timeline</h3>
              <p className="mt-1 text-xs text-slate-500">Track important dates and the current stage.</p>
            </div>

            <Field label="Date applied">
              <input
                type="date"
                value={draft.dateApplied}
                onChange={(event) => updateDraft("dateApplied", event.target.value)}
                className={inputClassName}
              />
            </Field>

            <Field label="Deadline">
              <input
                type="date"
                value={draft.deadline}
                onChange={(event) => updateDraft("deadline", event.target.value)}
                className={inputClassName}
              />
            </Field>

            <Field label="Status">
              <select
                value={draft.status}
                onChange={(event) =>
                  updateDraft("status", event.target.value as ApplicationDraft["status"])
                }
                className={inputClassName}
              >
                {applicationStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Interview stage">
              <select
                value={draft.interviewStage}
                onChange={(event) =>
                  updateDraft(
                    "interviewStage",
                    event.target.value as ApplicationDraft["interviewStage"],
                  )
                }
                className={inputClassName}
              >
                {interviewStageOptions.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Referral status">
              <select
                value={draft.referralStatus}
                onChange={(event) =>
                  updateDraft(
                    "referralStatus",
                    event.target.value as ApplicationDraft["referralStatus"],
                  )
                }
                className={inputClassName}
              >
                {referralStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="OA received">
              <select
                value={draft.oaReceived ? "Yes" : "No"}
                onChange={(event) =>
                  updateDraft("oaReceived", event.target.value === "Yes")
                }
                className={inputClassName}
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </Field>

            <div className="mt-3 border-t border-slate-200 pt-5 md:col-span-2 xl:col-span-3 dark:border-white/10">
              <h3 className="text-sm font-semibold text-slate-950 dark:text-white">Contacts and materials</h3>
              <p className="mt-1 text-xs text-slate-500">Keep outreach and submitted materials connected.</p>
            </div>

            <Field label="Recruiter or contact">
              <input
                value={draft.recruiterContact}
                onChange={(event) =>
                  updateDraft("recruiterContact", event.target.value)
                }
                className={inputClassName}
                placeholder="Jane Doe"
              />
            </Field>

            <Field label="Follow-up date">
              <input
                type="date"
                value={draft.followUpDate}
                onChange={(event) =>
                  updateDraft("followUpDate", event.target.value)
                }
                className={inputClassName}
              />
            </Field>

            <Field label="Resume version used">
              <input
                value={draft.resumeVersion}
                onChange={(event) =>
                  updateDraft("resumeVersion", event.target.value)
                }
                className={inputClassName}
                placeholder="Resume v4"
              />
            </Field>

            <Field label="Interest level">
              <select
                value={draft.interestLevel}
                onChange={(event) =>
                  updateDraft(
                    "interestLevel",
                    Number(event.target.value) as ApplicationDraft["interestLevel"],
                  )
                }
                className={inputClassName}
              >
                {interestLevelOptions.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Notes">
            <textarea
              value={draft.notes}
              onChange={(event) => updateDraft("notes", event.target.value)}
              className={`${inputClassName} min-h-32 resize-y`}
              placeholder="Add interview prep notes, referral context, or follow-up reminders."
            />
          </Field>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-ink-700 transition hover:border-slate-300 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              {isSubmitting
                ? "Saving..."
                : mode === "create"
                  ? "Create application"
                  : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
