import { getSafeRelativePath } from "@/lib/safe-redirect";
import {
  INPUT_LIMITS,
  InputValidationError,
  normalizeSingleLineText,
} from "@/lib/data/validation";

export const MINIMUM_PASSWORD_LENGTH = 12;
const MAXIMUM_PASSWORD_LENGTH = 128;
const MAXIMUM_EMAIL_LENGTH = 320;
const MAXIMUM_DISPLAY_NAME_LENGTH = 120;
const MAXIMUM_CAPTCHA_TOKEN_LENGTH = 4096;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class AuthRequestValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthRequestValidationError";
  }
}

function recordFrom(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new AuthRequestValidationError("The authentication request is invalid.");
  }
  return value as Record<string, unknown>;
}

function stringFrom(
  record: Record<string, unknown>,
  key: string,
  maximumLength: number,
) {
  const value = record[key];
  if (typeof value !== "string") {
    throw new AuthRequestValidationError("The authentication request is invalid.");
  }
  const normalized = value.trim();
  if (!normalized || normalized.length > maximumLength) {
    throw new AuthRequestValidationError("The authentication request is invalid.");
  }
  return normalized;
}

function emailFrom(record: Record<string, unknown>) {
  const email = stringFrom(record, "email", MAXIMUM_EMAIL_LENGTH).toLowerCase();
  if (!EMAIL_PATTERN.test(email)) {
    throw new AuthRequestValidationError("Enter a valid email address.");
  }
  return email;
}

function passwordFrom(
  record: Record<string, unknown>,
  options: { enforceMinimum: boolean },
) {
  const value = record.password;
  if (
    typeof value !== "string" ||
    value.length > MAXIMUM_PASSWORD_LENGTH ||
    (options.enforceMinimum && value.length < MINIMUM_PASSWORD_LENGTH) ||
    (!options.enforceMinimum && value.length < 1)
  ) {
    throw new AuthRequestValidationError(
      options.enforceMinimum
        ? `Password must contain at least ${MINIMUM_PASSWORD_LENGTH} characters.`
        : "The authentication request is invalid.",
    );
  }
  return value;
}

function captchaTokenFrom(record: Record<string, unknown>) {
  return stringFrom(record, "captchaToken", MAXIMUM_CAPTCHA_TOKEN_LENGTH);
}

export function parseLoginRequest(value: unknown) {
  const record = recordFrom(value);
  return {
    captchaToken: captchaTokenFrom(record),
    email: emailFrom(record),
    next: getSafeRelativePath(
      typeof record.next === "string" ? record.next : undefined,
    ),
    password: passwordFrom(record, { enforceMinimum: false }),
  };
}

export function parseSignupRequest(value: unknown) {
  const record = recordFrom(value);
  const email = emailFrom(record);
  let displayName: string;

  try {
    const rawDisplayName =
      typeof record.displayName === "string" ? record.displayName : "";
    displayName =
      normalizeSingleLineText(rawDisplayName, MAXIMUM_DISPLAY_NAME_LENGTH) ||
      normalizeSingleLineText(
        email.split("@")[0],
        INPUT_LIMITS.name,
        true,
      );
  } catch (error) {
    if (error instanceof InputValidationError) {
      throw new AuthRequestValidationError("Display name is too long.");
    }
    throw error;
  }

  return {
    captchaToken: captchaTokenFrom(record),
    displayName,
    email,
    password: passwordFrom(record, { enforceMinimum: true }),
  };
}

export function parseRecoveryRequest(value: unknown) {
  const record = recordFrom(value);
  return {
    captchaToken: captchaTokenFrom(record),
    email: emailFrom(record),
  };
}

export function parsePasswordUpdateRequest(value: unknown) {
  return {
    password: passwordFrom(recordFrom(value), { enforceMinimum: true }),
  };
}
