import { describe, expect, it } from "vitest";

import { parseApplication } from "@/lib/data/application-validation";
import { parseModuleRecord } from "@/lib/data/module-validation";
import {
  INPUT_LIMITS,
  InputValidationError,
  isValidCalendarDate,
  normalizeIsoTimestamp,
} from "@/lib/data/validation";

function applicationInput(overrides: Record<string, unknown> = {}) {
  return {
    company: " Example   Labs ",
    role: " Software\nEngineer ",
    location: "Remote",
    applicationLink: "https://example.com/jobs/1",
    dateApplied: "2026-07-28",
    deadline: null,
    status: "Applied",
    oaReceived: false,
    interviewStage: "None",
    recruiterContact: "",
    referralStatus: "None",
    followUpDate: null,
    resumeVersion: "General",
    notes: "  First line\r\nSecond line  ",
    interestLevel: 4,
    ...overrides,
  };
}

describe("server input normalization", () => {
  it("normalizes application text, URL, and multiline notes", () => {
    const parsed = parseApplication(applicationInput(), {
      requireDatabaseId: false,
    });

    expect(parsed).toMatchObject({
      company: "Example Labs",
      role: "Software Engineer",
      applicationLink: "https://example.com/jobs/1",
      notes: "First line\nSecond line",
    });
  });

  it("enforces name, contact, and note boundaries", () => {
    expect(
      parseApplication(applicationInput({ company: "x".repeat(INPUT_LIMITS.name) }), {
        requireDatabaseId: false,
      }),
    ).not.toBeNull();
    expect(
      parseApplication(applicationInput({ company: "x".repeat(INPUT_LIMITS.name + 1) }), {
        requireDatabaseId: false,
      }),
    ).toBeNull();
    expect(
      parseApplication(applicationInput({ role: "x".repeat(INPUT_LIMITS.contact + 1) }), {
        requireDatabaseId: false,
      }),
    ).toBeNull();
    expect(
      parseApplication(applicationInput({ notes: "x".repeat(INPUT_LIMITS.notes + 1) }), {
        requireDatabaseId: false,
      }),
    ).toBeNull();
  });

  it("rejects unsafe and oversized external URLs", () => {
    expect(
      parseApplication(applicationInput({ applicationLink: "javascript:alert(1)" }), {
        requireDatabaseId: false,
      }),
    ).toBeNull();
    expect(
      parseApplication(
        applicationInput({
          applicationLink: `https://example.com/${"x".repeat(INPUT_LIMITS.url)}`,
        }),
        { requireDatabaseId: false },
      ),
    ).toBeNull();
  });

  it("accepts real leap days and rejects impossible calendar dates", () => {
    expect(isValidCalendarDate("2024-02-29")).toBe(true);
    expect(isValidCalendarDate("2026-02-29")).toBe(false);
    expect(isValidCalendarDate("2026-02-31")).toBe(false);
    expect(
      parseApplication(applicationInput({ deadline: "2026-02-31" }), {
        requireDatabaseId: false,
      }),
    ).toBeNull();
  });

  it("requires strict, real ISO timestamps and normalizes offsets", () => {
    expect(normalizeIsoTimestamp("2026-07-28T12:30:00-04:00")).toBe(
      "2026-07-28T16:30:00.000Z",
    );
    expect(() => normalizeIsoTimestamp("July 28, 2026")).toThrow(
      InputValidationError,
    );
    expect(() => normalizeIsoTimestamp("2026-02-31T12:30:00Z")).toThrow(
      InputValidationError,
    );
  });

  it("bounds weekly counts from zero through ten thousand", () => {
    const goal = {
      week: "2026-W31",
      applicationGoal: 0,
      applicationsCompleted: 10_000,
      networkingGoal: 1,
      networkingCompleted: 1,
      leetCodeGoal: 1,
      leetCodeCompleted: 1,
    };

    expect(
      parseModuleRecord("weeklyGoals", goal, { requireDatabaseId: false }),
    ).not.toBeNull();
    expect(
      parseModuleRecord(
        "weeklyGoals",
        { ...goal, applicationGoal: -1 },
        { requireDatabaseId: false },
      ),
    ).toBeNull();
    expect(
      parseModuleRecord(
        "weeklyGoals",
        { ...goal, applicationGoal: 10_001 },
        { requireDatabaseId: false },
      ),
    ).toBeNull();
  });
});
