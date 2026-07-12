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
  createEmptyTargetCompanyDraft,
  priorityLevelOptions,
  roleTypeOptions,
  type TargetCompanyDraft,
} from "@/lib/target-companies";

type TargetCompanyFormModalProps = {
  initialValue?: TargetCompanyDraft | null;
  isOpen: boolean;
  isSubmitting?: boolean;
  mode: "create" | "edit";
  onClose: () => void;
  onSubmit: (draft: TargetCompanyDraft) => Promise<void> | void;
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

export function TargetCompanyFormModal({
  initialValue,
  isOpen,
  isSubmitting = false,
  mode,
  onClose,
  onSubmit,
}: TargetCompanyFormModalProps) {
  const [draft, setDraft] = useState<TargetCompanyDraft>(
    createEmptyTargetCompanyDraft,
  );
  const titleId = useId();
  const dialogRef = useDialogBehavior(isOpen, onClose);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setDraft(initialValue ?? createEmptyTargetCompanyDraft());
  }, [initialValue, isOpen]);

  if (!isOpen) {
    return null;
  }

  function updateDraft<K extends keyof TargetCompanyDraft>(
    key: K,
    value: TargetCompanyDraft[K],
  ) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      [key]: value,
    }));
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
        className="w-full max-w-3xl rounded-[2rem] border border-white/80 bg-slate-50 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5 sm:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
              {mode === "create" ? "New target company" : "Edit target company"}
            </p>
            <h2
              id={titleId}
              className="mt-2 text-2xl font-semibold tracking-tight text-ink-900"
            >
              {mode === "create"
                ? "Add a company to your target list"
                : "Update target company details"}
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
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Company">
              <input
                required
                value={draft.company}
                onChange={(event) => updateDraft("company", event.target.value)}
                className={inputClassName}
                placeholder="Anthropic"
              />
            </Field>

            <Field label="Role type">
              <select
                value={draft.roleType}
                onChange={(event) =>
                  updateDraft(
                    "roleType",
                    event.target.value as TargetCompanyDraft["roleType"],
                  )
                }
                className={inputClassName}
              >
                {roleTypeOptions.map((roleType) => (
                  <option key={roleType} value={roleType}>
                    {roleType}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Application season or month">
              <input
                value={draft.applicationSeason}
                onChange={(event) =>
                  updateDraft("applicationSeason", event.target.value)
                }
                className={inputClassName}
                placeholder="Fall 2026 or September 2026"
              />
            </Field>

            <Field label="Priority level">
              <select
                value={draft.priorityLevel}
                onChange={(event) =>
                  updateDraft(
                    "priorityLevel",
                    event.target.value as TargetCompanyDraft["priorityLevel"],
                  )
                }
                className={inputClassName}
              >
                {priorityLevelOptions.map((priorityLevel) => (
                  <option key={priorityLevel} value={priorityLevel}>
                    {priorityLevel}
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
              placeholder="Keep track of fit, timing, alumni context, or role-specific prep notes."
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
              className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              {isSubmitting ? "Saving..." : mode === "create" ? "Create target company" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
