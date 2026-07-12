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
  createEmptyNetworkingContactDraft,
  type NetworkingContactDraft,
} from "@/lib/networking";

type NetworkingFormModalProps = {
  initialValue?: NetworkingContactDraft | null;
  isOpen: boolean;
  isSubmitting?: boolean;
  mode: "create" | "edit";
  onClose: () => void;
  onSubmit: (draft: NetworkingContactDraft) => Promise<void> | void;
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

export function NetworkingFormModal({
  initialValue,
  isOpen,
  isSubmitting = false,
  mode,
  onClose,
  onSubmit,
}: NetworkingFormModalProps) {
  const [draft, setDraft] = useState<NetworkingContactDraft>(
    createEmptyNetworkingContactDraft,
  );
  const titleId = useId();
  const dialogRef = useDialogBehavior(isOpen, onClose);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setDraft(initialValue ?? createEmptyNetworkingContactDraft());
  }, [initialValue, isOpen]);

  if (!isOpen) {
    return null;
  }

  function updateDraft<K extends keyof NetworkingContactDraft>(
    key: K,
    value: NetworkingContactDraft[K],
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
        className="w-full max-w-4xl rounded-[2rem] border border-white/80 bg-slate-50 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5 sm:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
              {mode === "create" ? "New contact" : "Edit contact"}
            </p>
            <h2
              id={titleId}
              className="mt-2 text-2xl font-semibold tracking-tight text-ink-900"
            >
              {mode === "create"
                ? "Add a networking contact"
                : "Update networking contact details"}
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
            <Field label="Name">
              <input
                required
                value={draft.name}
                onChange={(event) => updateDraft("name", event.target.value)}
                className={inputClassName}
                placeholder="Jane Smith"
              />
            </Field>

            <Field label="Company">
              <input
                value={draft.company}
                onChange={(event) => updateDraft("company", event.target.value)}
                className={inputClassName}
                placeholder="OpenAI"
              />
            </Field>

            <Field label="Role">
              <input
                value={draft.role}
                onChange={(event) => updateDraft("role", event.target.value)}
                className={inputClassName}
                placeholder="Research Engineer"
              />
            </Field>

            <Field label="LinkedIn URL">
              <input
                type="url"
                value={draft.linkedInUrl}
                onChange={(event) => updateDraft("linkedInUrl", event.target.value)}
                className={inputClassName}
                placeholder="https://www.linkedin.com/in/..."
              />
            </Field>

            <Field label="Connected?">
              <select
                value={draft.connected ? "Yes" : "No"}
                onChange={(event) =>
                  updateDraft("connected", event.target.value === "Yes")
                }
                className={inputClassName}
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </Field>

            <Field label="Last contacted date">
              <input
                type="date"
                value={draft.lastContactedDate}
                onChange={(event) =>
                  updateDraft("lastContactedDate", event.target.value)
                }
                className={inputClassName}
              />
            </Field>

            <Field label="Referral requested?">
              <select
                value={draft.referralRequested ? "Yes" : "No"}
                onChange={(event) =>
                  updateDraft("referralRequested", event.target.value === "Yes")
                }
                className={inputClassName}
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </Field>

            <Field label="Referral received?">
              <select
                value={draft.referralReceived ? "Yes" : "No"}
                onChange={(event) =>
                  updateDraft("referralReceived", event.target.value === "Yes")
                }
                className={inputClassName}
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </Field>
          </div>

          <Field label="Notes">
            <textarea
              value={draft.notes}
              onChange={(event) => updateDraft("notes", event.target.value)}
              className={`${inputClassName} min-h-32 resize-y`}
              placeholder="Track outreach context, referral timing, and next follow-up steps."
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
              {isSubmitting ? "Saving..." : mode === "create" ? "Create contact" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
