import type { NetworkingContact } from "@/lib/types";

export type NetworkingContactDraft = {
  company: string;
  connected: boolean;
  lastContactedDate: string;
  linkedInUrl: string;
  name: string;
  notes: string;
  referralReceived: boolean;
  referralRequested: boolean;
  role: string;
};

function createNetworkingContactId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `networking-contact-${Date.now()}`;
}

function normalizeDateValue(value: string) {
  return value.trim() === "" ? null : value;
}

export function createEmptyNetworkingContactDraft(): NetworkingContactDraft {
  return {
    company: "",
    connected: false,
    lastContactedDate: "",
    linkedInUrl: "",
    name: "",
    notes: "",
    referralReceived: false,
    referralRequested: false,
    role: "",
  };
}

export function networkingContactToDraft(
  contact: NetworkingContact,
): NetworkingContactDraft {
  return {
    company: contact.company,
    connected: contact.connected,
    lastContactedDate: contact.lastContactedDate ?? "",
    linkedInUrl: contact.linkedInUrl,
    name: contact.name,
    notes: contact.notes,
    referralReceived: contact.referralReceived,
    referralRequested: contact.referralRequested,
    role: contact.role,
  };
}

export function createNetworkingContactFromDraft(
  draft: NetworkingContactDraft,
): NetworkingContact {
  const timestamp = new Date().toISOString();

  return {
    id: createNetworkingContactId(),
    company: draft.company.trim(),
    connected: draft.connected,
    createdAt: timestamp,
    lastContactedDate: normalizeDateValue(draft.lastContactedDate),
    linkedInUrl: draft.linkedInUrl.trim(),
    name: draft.name.trim(),
    notes: draft.notes.trim(),
    referralReceived: draft.referralReceived,
    referralRequested: draft.referralRequested,
    role: draft.role.trim(),
    updatedAt: timestamp,
  };
}

export function updateNetworkingContactFromDraft(
  contact: NetworkingContact,
  draft: NetworkingContactDraft,
): NetworkingContact {
  return {
    ...contact,
    company: draft.company.trim(),
    connected: draft.connected,
    lastContactedDate: normalizeDateValue(draft.lastContactedDate),
    linkedInUrl: draft.linkedInUrl.trim(),
    name: draft.name.trim(),
    notes: draft.notes.trim(),
    referralReceived: draft.referralReceived,
    referralRequested: draft.referralRequested,
    role: draft.role.trim(),
    updatedAt: new Date().toISOString(),
  };
}

export function formatNetworkingDate(value: string | null) {
  if (!value) {
    return "Not set";
  }

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return value;
  }

  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
