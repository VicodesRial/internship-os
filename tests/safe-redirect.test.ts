import { describe, expect, it } from "vitest";

import { getSafeRelativePath } from "@/lib/safe-redirect";

const deeplyEncodedProtocolRelativePath = Array.from(
  { length: 11 },
  (_, index) => index,
).reduce((value) => `/${encodeURIComponent(value.slice(1))}`, "//evil.example");

describe("getSafeRelativePath", () => {
  it.each([
    ["/", "/"],
    ["/applications", "/applications"],
    ["/applications?status=Applied#latest", "/applications?status=Applied#latest"],
  ])("accepts an internal path", (input, expected) => {
    expect(getSafeRelativePath(input)).toBe(expected);
  });

  it.each([
    null,
    "",
    "applications",
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "/%5c%5cevil.example",
    "/%255c%255cevil.example",
    "/%2f%2fevil.example",
    "/%252f%252fevil.example",
    "/%25252f%25252fevil.example",
    deeplyEncodedProtocolRelativePath,
    "/safe\u0000unsafe",
    "/%0a//evil.example",
    "/%",
  ])("rejects an unsafe redirect value", (input) => {
    expect(getSafeRelativePath(input)).toBe("/");
  });
});
