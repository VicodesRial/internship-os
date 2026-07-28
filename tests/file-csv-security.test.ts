import { describe, expect, it } from "vitest";

import {
  exportCollectionCsv,
  importCollectionCsv,
} from "@/lib/csv";
import {
  MAX_IMPORT_FILE_BYTES,
  validateImportFile,
} from "@/lib/file-validation";
import type { TargetCompany } from "@/lib/types";

describe("import file validation", () => {
  it("rejects empty and oversized files before callers read them", () => {
    expect(
      validateImportFile(
        { name: "backup.json", size: 0, type: "application/json" },
        "json",
      ),
    ).toContain("empty");
    expect(
      validateImportFile(
        {
          name: "backup.json",
          size: MAX_IMPORT_FILE_BYTES + 1,
          type: "application/json",
        },
        "json",
      ),
    ).toContain("1 MB");
  });

  it("permits only matching JSON or CSV extensions and advisory MIME types", () => {
    expect(
      validateImportFile(
        { name: "backup.json", size: 10, type: "application/json" },
        "json",
      ),
    ).toBeNull();
    expect(
      validateImportFile(
        { name: "backup.csv", size: 10, type: "text/csv; charset=utf-8" },
        "csv",
      ),
    ).toBeNull();
    expect(
      validateImportFile(
        { name: "backup.exe", size: 10, type: "application/json" },
        "json",
      ),
    ).toContain(".json");
    expect(
      validateImportFile(
        { name: "backup.csv", size: 10, type: "image/png" },
        "csv",
      ),
    ).toContain("CSV");
  });
});

describe("CSV spreadsheet safety", () => {
  it.each(["=1+1", "+SUM(A1)", "-2+3", "@cmd", "\tformula", "\rformula"])(
    "neutralizes and safely round-trips a cell beginning with %j",
    (company) => {
      const record: TargetCompany = {
        id: "target-1",
        company,
        roleType: "SWE",
        applicationSeason: "Fall 2026",
        priorityLevel: "High",
        notes: "",
        createdAt: "2026-07-28T12:00:00.000Z",
        updatedAt: "2026-07-28T12:00:00.000Z",
      };
      const csv = exportCollectionCsv("targetCompanies", [record]);
      const dataRow = csv.split("\n")[1];
      const imported = importCollectionCsv("targetCompanies", csv);

      expect(dataRow).toContain('"\t');
      expect(imported?.records[0].company).toBe(company.trim());
    },
  );

  it("rejects impossible dates and counts above the server limit", () => {
    const invalidGoalCsv = [
      "id,week,applicationGoal,applicationsCompleted,networkingGoal,networkingCompleted,leetCodeGoal,leetCodeCompleted,createdAt,updatedAt",
      "goal-1,2026-W31,10001,0,0,0,0,0,2026-07-28T12:00:00Z,2026-07-28T12:00:00Z",
    ].join("\n");

    expect(importCollectionCsv("weeklyGoals", invalidGoalCsv)).toBeNull();
  });
});
