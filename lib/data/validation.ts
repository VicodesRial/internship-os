import { getSafeExternalUrl } from "@/lib/external-url";

export const INPUT_LIMITS = {
  contact: 160,
  count: 10_000,
  identifier: 200,
  name: 120,
  notes: 5_000,
  url: 2_048,
} as const;

const ISO_TIMESTAMP_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const SINGLE_LINE_CONTROL_PATTERN = /[\u0000-\u001f\u007f]/g;
const MULTILINE_CONTROL_PATTERN = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;

export class InputValidationError extends Error {
  constructor() {
    super("Input validation failed.");
    this.name = "InputValidationError";
  }
}

function fail(): never {
  throw new InputValidationError();
}

export function asInputRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail();
  return value as Record<string, unknown>;
}

export function normalizeSingleLineText(
  value: unknown,
  maximumLength: number,
  required = false,
) {
  if (typeof value !== "string") fail();
  const normalized = value
    .normalize("NFC")
    .replace(SINGLE_LINE_CONTROL_PATTERN, " ")
    .replace(/\s+/g, " ")
    .trim();
  if ((required && !normalized) || normalized.length > maximumLength) fail();
  return normalized;
}

export function normalizeNotes(value: unknown) {
  if (typeof value !== "string") fail();
  const normalized = value
    .normalize("NFC")
    .replace(/\r\n?/g, "\n")
    .replace(MULTILINE_CONTROL_PATTERN, "")
    .trim();
  if (normalized.length > INPUT_LIMITS.notes) fail();
  return normalized;
}

export function normalizeOptionalExternalUrl(value: unknown) {
  const normalized = normalizeSingleLineText(value, INPUT_LIMITS.url);
  if (!normalized) return "";
  const safeUrl = getSafeExternalUrl(normalized);
  if (!safeUrl || safeUrl.length > INPUT_LIMITS.url) fail();
  return safeUrl;
}

export function isValidCalendarDate(value: string) {
  if (!DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function normalizeNullableCalendarDate(value: unknown) {
  if (value === null || value === "") return null;
  if (typeof value !== "string" || !isValidCalendarDate(value)) fail();
  return value;
}

export function normalizeIsoTimestamp(value: unknown) {
  if (typeof value !== "string" || !ISO_TIMESTAMP_PATTERN.test(value)) fail();
  if (!isValidCalendarDate(value.slice(0, 10))) fail();
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) fail();
  return date.toISOString();
}

export function normalizeIdentifier(value: unknown) {
  return normalizeSingleLineText(value, INPUT_LIMITS.identifier, true);
}

export function normalizeCount(value: unknown) {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < 0 ||
    value > INPUT_LIMITS.count
  ) {
    fail();
  }
  return value;
}

export function normalizeBoolean(value: unknown) {
  if (typeof value !== "boolean") fail();
  return value;
}

export function normalizeEnum<T extends string | number>(
  value: unknown,
  options: readonly T[],
) {
  if (
    (typeof value !== "string" && typeof value !== "number") ||
    !options.includes(value as T)
  ) {
    fail();
  }
  return value as T;
}
