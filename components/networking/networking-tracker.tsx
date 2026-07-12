"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { NetworkingFormModal } from "@/components/networking/networking-form-modal";
import { useAppData } from "@/components/providers/app-data-provider";
import {
  createNetworkingContactFromDraft,
  formatNetworkingDate,
  networkingContactToDraft,
  updateNetworkingContactFromDraft,
  type NetworkingContactDraft,
} from "@/lib/networking";
import type { NetworkingContact } from "@/lib/types";

function EmptyNetworkingState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white/70 p-10 text-center shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
        Networking
      </p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink-900">
        No networking contacts added yet
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-ink-600">
        Track outreach, connection progress, and referral conversations in one
        place so follow-ups stay intentional.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="mt-6 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        Add contact
      </button>
    </div>
  );
}

function LoadingNetworkingState() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl">
          <div className="h-4 w-28 rounded-full bg-slate-200" />
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

function NetworkingSummary({
  connected,
  referralsReceived,
  total,
}: {
  connected: number;
  referralsReceived: number;
  total: number;
}) {
  const summaryItems = [
    { label: "Tracked", value: total },
    { label: "Connected", value: connected },
    { label: "Referrals received", value: referralsReceived },
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

function YesNoPill({ value }: { value: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
        value
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-100 text-slate-700"
      }`}
    >
      {value ? "Yes" : "No"}
    </span>
  );
}

function NetworkingCards({
  contacts,
  onDelete,
  onEdit,
}: {
  contacts: NetworkingContact[];
  onDelete: (contact: NetworkingContact) => void;
  onEdit: (contact: NetworkingContact) => void;
}) {
  return (
    <div className="grid gap-4 xl:hidden">
      {contacts.map((contact) => (
        <article
          key={contact.id}
          className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-xl font-semibold tracking-tight text-ink-900">
                {contact.name}
              </h3>
              <p className="mt-1 text-sm text-ink-600">
                {contact.role || "No role"} at {contact.company || "No company"}
              </p>
            </div>
            <YesNoPill value={contact.connected} />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                Referral requested
              </p>
              <div className="mt-2">
                <YesNoPill value={contact.referralRequested} />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                Referral received
              </p>
              <div className="mt-2">
                <YesNoPill value={contact.referralReceived} />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                Last contacted
              </p>
              <p className="mt-2 text-sm font-medium text-ink-900">
                {formatNetworkingDate(contact.lastContactedDate)}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                LinkedIn
              </p>
              <p className="mt-2 text-sm font-medium text-ink-900">
                {contact.linkedInUrl ? "Added" : "Not set"}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
              Notes
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink-700">
              {contact.notes || "No notes"}
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onEdit(contact)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-ink-700 transition hover:border-slate-300 hover:bg-slate-100"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => onDelete(contact)}
              className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100"
            >
              Delete
            </button>
            {contact.linkedInUrl ? (
              <a
                href={contact.linkedInUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
              >
                Open LinkedIn
              </a>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}

function NetworkingTable({
  contacts,
  onDelete,
  onEdit,
}: {
  contacts: NetworkingContact[];
  onDelete: (contact: NetworkingContact) => void;
  onEdit: (contact: NetworkingContact) => void;
}) {
  return (
    <div className="hidden min-w-0 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm xl:block">
      <div className="overflow-x-auto">
        <table className="min-w-[1280px] divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs font-semibold uppercase tracking-[0.16em] text-ink-500">
              <th className="px-4 py-4">Name</th>
              <th className="px-4 py-4">Company</th>
              <th className="px-4 py-4">Role</th>
              <th className="px-4 py-4">LinkedIn</th>
              <th className="px-4 py-4">Connected</th>
              <th className="px-4 py-4">Referral requested</th>
              <th className="px-4 py-4">Referral received</th>
              <th className="px-4 py-4">Last contacted</th>
              <th className="px-4 py-4">Notes</th>
              <th className="sticky right-0 bg-slate-50 px-4 py-4 shadow-[-10px_0_20px_-16px_rgba(15,23,42,0.3)]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {contacts.map((contact) => (
              <tr key={contact.id} className="align-top text-sm text-ink-700">
                <td className="px-4 py-4 font-semibold text-ink-900">{contact.name}</td>
                <td className="px-4 py-4">{contact.company || "Not set"}</td>
                <td className="px-4 py-4">{contact.role || "Not set"}</td>
                <td className="px-4 py-4">
                  {contact.linkedInUrl ? (
                    <a
                      href={contact.linkedInUrl}
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
                <td className="px-4 py-4">
                  <YesNoPill value={contact.connected} />
                </td>
                <td className="px-4 py-4">
                  <YesNoPill value={contact.referralRequested} />
                </td>
                <td className="px-4 py-4">
                  <YesNoPill value={contact.referralReceived} />
                </td>
                <td className="px-4 py-4">
                  {formatNetworkingDate(contact.lastContactedDate)}
                </td>
                <td className="max-w-[320px] px-4 py-4 text-ink-600">
                  <p className="line-clamp-3 whitespace-pre-wrap">
                    {contact.notes || "No notes"}
                  </p>
                </td>
                <td className="sticky right-0 bg-white px-4 py-4 shadow-[-10px_0_20px_-16px_rgba(15,23,42,0.2)]">
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(contact)}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-ink-700 transition hover:border-slate-300 hover:bg-slate-100"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(contact)}
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

export function NetworkingTracker() {
  const router = useRouter();
  const {
    cloudError,
    createContact,
    data,
    deleteContact,
    hasHydrated,
    isCloudMutating,
    moduleLoadErrors,
    updateContact,
  } = useAppData();
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const contacts = useMemo(
    () =>
      [...data.contacts].sort((left, right) =>
        right.updatedAt.localeCompare(left.updatedAt),
      ),
    [data.contacts],
  );

  const connectedContacts = contacts.filter((contact) => contact.connected).length;
  const receivedReferrals = contacts.filter(
    (contact) => contact.referralReceived,
  ).length;

  const editingContact =
    editingContactId === null
      ? null
      : contacts.find((contact) => contact.id === editingContactId) ?? null;
  const modalInitialValue = editingContact
    ? networkingContactToDraft(editingContact)
    : null;

  function openCreateModal() {
    setEditingContactId(null);
    setIsModalOpen(true);
  }

  function openEditModal(contact: NetworkingContact) {
    setEditingContactId(contact.id);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingContactId(null);
  }

  async function handleSubmit(draft: NetworkingContactDraft) {
    const succeeded = editingContact
      ? await updateContact(updateNetworkingContactFromDraft(editingContact, draft))
      : await createContact(createNetworkingContactFromDraft(draft));
    if (succeeded) closeModal();
  }

  async function handleDelete(contact: NetworkingContact) {
    const confirmed = window.confirm(`Delete ${contact.name} from networking contacts?`);

    if (!confirmed) {
      return;
    }

    await deleteContact(contact.id);
  }

  if (!hasHydrated) {
    return <LoadingNetworkingState />;
  }

  return (
    <section className="min-w-0 space-y-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <p className="command-label">MODULE_04 // NETWORK_UPLINK</p>
          <h2 className="font-pixel-display mt-1 text-xl uppercase tracking-tight text-ink-900">
            Network Uplink
          </h2>
          <p className="mt-3 max-w-3xl text-base leading-7 text-ink-600">
            Track who you reached out to, whether you are connected, and how each
            referral conversation is moving.
          </p>
        </div>

        <div className="shrink-0 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={openCreateModal}
            disabled={isCloudMutating}
            className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Log contact
          </button>
        </div>
      </div>

      {moduleLoadErrors.contacts ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {moduleLoadErrors.contacts} <button type="button" className="font-semibold underline" onClick={() => router.refresh()}>Retry</button>
        </div>
      ) : cloudError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{cloudError} Your previous data was restored.</div>
      ) : null}

      <NetworkingSummary
        total={contacts.length}
        connected={connectedContacts}
        referralsReceived={receivedReferrals}
      />

      {contacts.length === 0 ? (
        <EmptyNetworkingState onCreate={openCreateModal} />
      ) : (
        <>
          <NetworkingTable contacts={contacts} onDelete={handleDelete} onEdit={openEditModal} />
          <NetworkingCards contacts={contacts} onDelete={handleDelete} onEdit={openEditModal} />
        </>
      )}

      <NetworkingFormModal
        initialValue={modalInitialValue}
        isOpen={isModalOpen}
        isSubmitting={isCloudMutating}
        mode={editingContact ? "edit" : "create"}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
    </section>
  );
}
