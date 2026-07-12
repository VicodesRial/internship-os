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
  createEmptyWeeklyGoalDraft,
  getCurrentIsoWeekLabel,
  type WeeklyGoalDraft,
} from "@/lib/weekly-goals";

type WeeklyGoalFormModalProps = {
  initialValue?: WeeklyGoalDraft | null;
  isOpen: boolean;
  isSubmitting?: boolean;
  mode: "create" | "edit";
  onClose: () => void;
  onSubmit: (draft: WeeklyGoalDraft) => Promise<void> | void;
};

type FieldProps = {
  children: ReactNode;
  label: string;
};

function Field({ children, label }: FieldProps) {
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

export function WeeklyGoalFormModal({
  initialValue,
  isOpen,
  isSubmitting = false,
  mode,
  onClose,
  onSubmit,
}: WeeklyGoalFormModalProps) {
  const [draft, setDraft] = useState<WeeklyGoalDraft>(createEmptyWeeklyGoalDraft);
  const titleId = useId();
  const dialogRef = useDialogBehavior(isOpen, onClose);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setDraft(initialValue ?? createEmptyWeeklyGoalDraft());
  }, [initialValue, isOpen]);

  if (!isOpen) {
    return null;
  }

  function updateDraft<K extends keyof WeeklyGoalDraft>(
    key: K,
    value: WeeklyGoalDraft[K],
  ) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      [key]: value,
    }));
  }

  function updateNumericField<K extends keyof WeeklyGoalDraft>(
    key: K,
    value: string,
  ) {
    updateDraft(key, Number(value) as WeeklyGoalDraft[K]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isSubmitting) await onSubmit(draft);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 px-3 py-5">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-4xl rounded-[2rem] border border-white/80 bg-slate-50 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5 sm:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
              {mode === "create" ? "New weekly goal" : "Edit weekly goal"}
            </p>
            <h2
              id={titleId}
              className="mt-2 text-2xl font-semibold tracking-tight text-ink-900"
            >
              {mode === "create"
                ? "Add a weekly execution goal"
                : "Update weekly goal details"}
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

        <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6 sm:px-8">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Field label="Week">
              <div className="space-y-2">
                <input
                  required
                  value={draft.week}
                  onChange={(event) => updateDraft("week", event.target.value)}
                  className={inputClassName}
                  placeholder="2026-W30"
                />
                {mode === "create" ? (
                  <button
                    type="button"
                    onClick={() => updateDraft("week", getCurrentIsoWeekLabel())}
                    className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
                  >
                    Use current week
                  </button>
                ) : null}
              </div>
            </Field>

            <Field label="Application goal">
              <input
                type="number"
                min="0"
                value={draft.applicationGoal}
                onChange={(event) =>
                  updateNumericField("applicationGoal", event.target.value)
                }
                className={inputClassName}
              />
            </Field>

            <Field label="Applications completed">
              <input
                type="number"
                min="0"
                value={draft.applicationsCompleted}
                onChange={(event) =>
                  updateNumericField("applicationsCompleted", event.target.value)
                }
                className={inputClassName}
              />
            </Field>

            <Field label="Networking goal">
              <input
                type="number"
                min="0"
                value={draft.networkingGoal}
                onChange={(event) =>
                  updateNumericField("networkingGoal", event.target.value)
                }
                className={inputClassName}
              />
            </Field>

            <Field label="Networking completed">
              <input
                type="number"
                min="0"
                value={draft.networkingCompleted}
                onChange={(event) =>
                  updateNumericField("networkingCompleted", event.target.value)
                }
                className={inputClassName}
              />
            </Field>

            <Field label="LeetCode goal">
              <input
                type="number"
                min="0"
                value={draft.leetCodeGoal}
                onChange={(event) =>
                  updateNumericField("leetCodeGoal", event.target.value)
                }
                className={inputClassName}
              />
            </Field>

            <Field label="LeetCode completed">
              <input
                type="number"
                min="0"
                value={draft.leetCodeCompleted}
                onChange={(event) =>
                  updateNumericField("leetCodeCompleted", event.target.value)
                }
                className={inputClassName}
              />
            </Field>
          </div>

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
              className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              {isSubmitting ? "Saving..." : mode === "create" ? "Create weekly goal" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
