import {
  applicationStatusOptions,
  interviewStageOptions,
  referralStatusOptions,
} from "@/lib/applications";
import { priorityLevelOptions, roleTypeOptions } from "@/lib/target-companies";
import type {
  AppDataStore,
  Application,
  ApplicationStatus,
  InterestLevel,
  InterviewStage,
  NetworkingContact,
  PriorityLevel,
  ReferralStatus,
  RoleType,
  TargetCompany,
  WeeklyGoal,
} from "@/lib/types";

export type CsvCollectionKey = keyof AppDataStore;

type CsvImportResult<T> = {
  count: number;
  records: T[];
};

type CsvColumnDefinition<T> = {
  header: string;
  read: (record: T) => string;
};

type ParsedCsvRow = Record<string, string>;

const csvCollectionLabels: Record<CsvCollectionKey, string> = {
  applications: "Applications",
  targetCompanies: "Target companies",
  contacts: "Contacts",
  weeklyGoals: "Weekly goals",
};

const applicationColumns: CsvColumnDefinition<Application>[] = [
  { header: "id", read: (record) => record.id },
  { header: "company", read: (record) => record.company },
  { header: "role", read: (record) => record.role },
  { header: "location", read: (record) => record.location },
  { header: "applicationLink", read: (record) => record.applicationLink },
  { header: "dateApplied", read: (record) => record.dateApplied ?? "" },
  { header: "deadline", read: (record) => record.deadline ?? "" },
  { header: "status", read: (record) => record.status },
  { header: "oaReceived", read: (record) => String(record.oaReceived) },
  { header: "interviewStage", read: (record) => record.interviewStage },
  { header: "recruiterContact", read: (record) => record.recruiterContact },
  { header: "referralStatus", read: (record) => record.referralStatus },
  { header: "followUpDate", read: (record) => record.followUpDate ?? "" },
  { header: "resumeVersion", read: (record) => record.resumeVersion },
  { header: "notes", read: (record) => record.notes },
  { header: "interestLevel", read: (record) => String(record.interestLevel) },
  { header: "createdAt", read: (record) => record.createdAt },
  { header: "updatedAt", read: (record) => record.updatedAt },
];

const targetCompanyColumns: CsvColumnDefinition<TargetCompany>[] = [
  { header: "id", read: (record) => record.id },
  { header: "company", read: (record) => record.company },
  { header: "roleType", read: (record) => record.roleType },
  { header: "applicationSeason", read: (record) => record.applicationSeason },
  { header: "priorityLevel", read: (record) => record.priorityLevel },
  { header: "notes", read: (record) => record.notes },
  { header: "createdAt", read: (record) => record.createdAt },
  { header: "updatedAt", read: (record) => record.updatedAt },
];

const contactColumns: CsvColumnDefinition<NetworkingContact>[] = [
  { header: "id", read: (record) => record.id },
  { header: "name", read: (record) => record.name },
  { header: "company", read: (record) => record.company },
  { header: "role", read: (record) => record.role },
  { header: "linkedInUrl", read: (record) => record.linkedInUrl },
  { header: "connected", read: (record) => String(record.connected) },
  {
    header: "referralRequested",
    read: (record) => String(record.referralRequested),
  },
  { header: "referralReceived", read: (record) => String(record.referralReceived) },
  {
    header: "lastContactedDate",
    read: (record) => record.lastContactedDate ?? "",
  },
  { header: "notes", read: (record) => record.notes },
  { header: "createdAt", read: (record) => record.createdAt },
  { header: "updatedAt", read: (record) => record.updatedAt },
];

const weeklyGoalColumns: CsvColumnDefinition<WeeklyGoal>[] = [
  { header: "id", read: (record) => record.id },
  { header: "week", read: (record) => record.week },
  { header: "applicationGoal", read: (record) => String(record.applicationGoal) },
  {
    header: "applicationsCompleted",
    read: (record) => String(record.applicationsCompleted),
  },
  { header: "networkingGoal", read: (record) => String(record.networkingGoal) },
  {
    header: "networkingCompleted",
    read: (record) => String(record.networkingCompleted),
  },
  { header: "leetCodeGoal", read: (record) => String(record.leetCodeGoal) },
  {
    header: "leetCodeCompleted",
    read: (record) => String(record.leetCodeCompleted),
  },
  { header: "createdAt", read: (record) => record.createdAt },
  { header: "updatedAt", read: (record) => record.updatedAt },
];

const csvColumns = {
  applications: applicationColumns,
  targetCompanies: targetCompanyColumns,
  contacts: contactColumns,
  weeklyGoals: weeklyGoalColumns,
} as const;

function escapeCsvValue(value: string) {
  if (/["\n,]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }

  return value;
}

function serializeCsv(rows: string[][]) {
  return rows
    .map((row) => row.map((value) => escapeCsvValue(value)).join(","))
    .join("\n");
}

function parseCsv(input: string): string[][] | null {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentValue = "";
  let index = 0;
  let insideQuotes = false;

  while (index < input.length) {
    const character = input[index];

    if (insideQuotes) {
      if (character === '"') {
        if (input[index + 1] === '"') {
          currentValue += '"';
          index += 2;
          continue;
        }

        insideQuotes = false;
        index += 1;
        continue;
      }

      currentValue += character;
      index += 1;
      continue;
    }

    if (character === '"') {
      insideQuotes = true;
      index += 1;
      continue;
    }

    if (character === ",") {
      currentRow.push(currentValue);
      currentValue = "";
      index += 1;
      continue;
    }

    if (character === "\n") {
      currentRow.push(currentValue);
      rows.push(currentRow);
      currentRow = [];
      currentValue = "";
      index += 1;
      continue;
    }

    if (character === "\r") {
      index += 1;
      continue;
    }

    currentValue += character;
    index += 1;
  }

  if (insideQuotes) {
    return null;
  }

  if (currentValue !== "" || currentRow.length > 0) {
    currentRow.push(currentValue);
    rows.push(currentRow);
  }

  return rows.filter((row) => row.some((value) => value.trim() !== ""));
}

function createRecordId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeText(value: string) {
  return value.trim();
}

function normalizeNullableDate(value: string) {
  const trimmedValue = value.trim();

  if (trimmedValue === "") {
    return null;
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(trimmedValue) ? trimmedValue : null;
}

function normalizeTimestamp(value: string) {
  const trimmedValue = value.trim();

  if (trimmedValue === "") {
    return new Date().toISOString();
  }

  return Number.isNaN(Date.parse(trimmedValue)) ? null : trimmedValue;
}

function parseBoolean(value: string) {
  const normalizedValue = value.trim().toLowerCase();

  if (normalizedValue === "true" || normalizedValue === "yes" || normalizedValue === "1") {
    return true;
  }

  if (normalizedValue === "false" || normalizedValue === "no" || normalizedValue === "0") {
    return false;
  }

  return null;
}

function parseInteger(value: string) {
  const trimmedValue = value.trim();

  if (!/^-?\d+$/.test(trimmedValue)) {
    return null;
  }

  return Number.parseInt(trimmedValue, 10);
}

function parseInterestLevel(value: string) {
  const parsedValue = parseInteger(value);

  return parsedValue !== null &&
    [1, 2, 3, 4, 5].includes(parsedValue)
    ? (parsedValue as InterestLevel)
    : null;
}

function parseEnumValue<T extends string>(value: string, options: readonly T[]) {
  const trimmedValue = value.trim();

  return options.includes(trimmedValue as T) ? (trimmedValue as T) : null;
}

function createRowMap(headers: string[], values: string[]) {
  return headers.reduce<ParsedCsvRow>((record, header, index) => {
    record[header] = values[index] ?? "";
    return record;
  }, {});
}

function validateHeaders(
  headers: string[],
  expectedHeaders: readonly string[],
) {
  return expectedHeaders.every((header) => headers.includes(header));
}

function parseApplications(rows: ParsedCsvRow[]): CsvImportResult<Application> | null {
  const records: Application[] = [];

  for (const row of rows) {
    const company = normalizeText(row.company ?? "");
    const role = normalizeText(row.role ?? "");
    const status = parseEnumValue<ApplicationStatus>(
      row.status ?? "",
      applicationStatusOptions,
    );
    const interviewStage = parseEnumValue<InterviewStage>(
      row.interviewStage ?? "",
      interviewStageOptions,
    );
    const referralStatus = parseEnumValue<ReferralStatus>(
      row.referralStatus ?? "",
      referralStatusOptions,
    );
    const oaReceived = parseBoolean(row.oaReceived ?? "");
    const interestLevel = parseInterestLevel(row.interestLevel ?? "");
    const createdAt = normalizeTimestamp(row.createdAt ?? "");
    const updatedAt = normalizeTimestamp(row.updatedAt ?? "");
    const dateApplied = normalizeNullableDate(row.dateApplied ?? "");
    const deadline = normalizeNullableDate(row.deadline ?? "");
    const followUpDate = normalizeNullableDate(row.followUpDate ?? "");

    if (
      company === "" ||
      role === "" ||
      !status ||
      !interviewStage ||
      !referralStatus ||
      oaReceived === null ||
      interestLevel === null ||
      createdAt === null ||
      updatedAt === null ||
      (row.dateApplied?.trim() !== "" && dateApplied === null) ||
      (row.deadline?.trim() !== "" && deadline === null) ||
      (row.followUpDate?.trim() !== "" && followUpDate === null)
    ) {
      return null;
    }

    records.push({
      id: normalizeText(row.id ?? "") || createRecordId("application"),
      company,
      role,
      location: normalizeText(row.location ?? ""),
      applicationLink: normalizeText(row.applicationLink ?? ""),
      dateApplied,
      deadline,
      status,
      oaReceived,
      interviewStage,
      recruiterContact: normalizeText(row.recruiterContact ?? ""),
      referralStatus,
      followUpDate,
      resumeVersion: normalizeText(row.resumeVersion ?? ""),
      notes: row.notes ?? "",
      interestLevel,
      createdAt,
      updatedAt,
    });
  }

  return {
    count: records.length,
    records,
  };
}

function parseTargetCompanies(
  rows: ParsedCsvRow[],
): CsvImportResult<TargetCompany> | null {
  const records: TargetCompany[] = [];

  for (const row of rows) {
    const company = normalizeText(row.company ?? "");
    const roleType = parseEnumValue<RoleType>(row.roleType ?? "", roleTypeOptions);
    const priorityLevel = parseEnumValue<PriorityLevel>(
      row.priorityLevel ?? "",
      priorityLevelOptions,
    );
    const createdAt = normalizeTimestamp(row.createdAt ?? "");
    const updatedAt = normalizeTimestamp(row.updatedAt ?? "");

    if (
      company === "" ||
      !roleType ||
      !priorityLevel ||
      createdAt === null ||
      updatedAt === null
    ) {
      return null;
    }

    records.push({
      id: normalizeText(row.id ?? "") || createRecordId("target-company"),
      company,
      roleType,
      applicationSeason: normalizeText(row.applicationSeason ?? ""),
      priorityLevel,
      notes: row.notes ?? "",
      createdAt,
      updatedAt,
    });
  }

  return {
    count: records.length,
    records,
  };
}

function parseContacts(
  rows: ParsedCsvRow[],
): CsvImportResult<NetworkingContact> | null {
  const records: NetworkingContact[] = [];

  for (const row of rows) {
    const name = normalizeText(row.name ?? "");
    const company = normalizeText(row.company ?? "");
    const connected = parseBoolean(row.connected ?? "");
    const referralRequested = parseBoolean(row.referralRequested ?? "");
    const referralReceived = parseBoolean(row.referralReceived ?? "");
    const createdAt = normalizeTimestamp(row.createdAt ?? "");
    const updatedAt = normalizeTimestamp(row.updatedAt ?? "");
    const lastContactedDate = normalizeNullableDate(row.lastContactedDate ?? "");

    if (
      name === "" ||
      company === "" ||
      connected === null ||
      referralRequested === null ||
      referralReceived === null ||
      createdAt === null ||
      updatedAt === null ||
      (row.lastContactedDate?.trim() !== "" && lastContactedDate === null)
    ) {
      return null;
    }

    records.push({
      id: normalizeText(row.id ?? "") || createRecordId("contact"),
      name,
      company,
      role: normalizeText(row.role ?? ""),
      linkedInUrl: normalizeText(row.linkedInUrl ?? ""),
      connected,
      referralRequested,
      referralReceived,
      lastContactedDate,
      notes: row.notes ?? "",
      createdAt,
      updatedAt,
    });
  }

  return {
    count: records.length,
    records,
  };
}

function parseWeeklyGoals(rows: ParsedCsvRow[]): CsvImportResult<WeeklyGoal> | null {
  const records: WeeklyGoal[] = [];

  for (const row of rows) {
    const week = normalizeText(row.week ?? "");
    const applicationGoal = parseInteger(row.applicationGoal ?? "");
    const applicationsCompleted = parseInteger(row.applicationsCompleted ?? "");
    const networkingGoal = parseInteger(row.networkingGoal ?? "");
    const networkingCompleted = parseInteger(row.networkingCompleted ?? "");
    const leetCodeGoal = parseInteger(row.leetCodeGoal ?? "");
    const leetCodeCompleted = parseInteger(row.leetCodeCompleted ?? "");
    const createdAt = normalizeTimestamp(row.createdAt ?? "");
    const updatedAt = normalizeTimestamp(row.updatedAt ?? "");

    if (
      week === "" ||
      applicationGoal === null ||
      applicationsCompleted === null ||
      networkingGoal === null ||
      networkingCompleted === null ||
      leetCodeGoal === null ||
      leetCodeCompleted === null ||
      applicationGoal < 0 ||
      applicationsCompleted < 0 ||
      networkingGoal < 0 ||
      networkingCompleted < 0 ||
      leetCodeGoal < 0 ||
      leetCodeCompleted < 0 ||
      createdAt === null ||
      updatedAt === null
    ) {
      return null;
    }

    records.push({
      id: normalizeText(row.id ?? "") || createRecordId("weekly-goal"),
      week,
      applicationGoal,
      applicationsCompleted,
      networkingGoal,
      networkingCompleted,
      leetCodeGoal,
      leetCodeCompleted,
      createdAt,
      updatedAt,
    });
  }

  return {
    count: records.length,
    records,
  };
}

export function getCsvCollectionLabel(collectionKey: CsvCollectionKey) {
  return csvCollectionLabels[collectionKey];
}

export function exportCollectionCsv<T extends CsvCollectionKey>(
  collectionKey: T,
  records: AppDataStore[T],
) {
  const columns = csvColumns[collectionKey] as CsvColumnDefinition<
    AppDataStore[T][number]
  >[];

  return serializeCsv([
    columns.map((column) => column.header),
    ...records.map((record) => columns.map((column) => column.read(record))),
  ]);
}

export function importCollectionCsv<T extends CsvCollectionKey>(
  collectionKey: T,
  input: string,
): CsvImportResult<AppDataStore[T][number]> | null {
  const rows = parseCsv(input);

  if (!rows || rows.length === 0) {
    return null;
  }

  const headers = rows[0].map((value) => value.trim());
  const expectedHeaders = csvColumns[collectionKey].map((column) => column.header);

  if (!validateHeaders(headers, expectedHeaders)) {
    return null;
  }

  const parsedRows = rows.slice(1).map((row) => createRowMap(headers, row));

  if (collectionKey === "applications") {
    return parseApplications(parsedRows) as CsvImportResult<AppDataStore[T][number]> | null;
  }

  if (collectionKey === "targetCompanies") {
    return parseTargetCompanies(parsedRows) as CsvImportResult<
      AppDataStore[T][number]
    > | null;
  }

  if (collectionKey === "contacts") {
    return parseContacts(parsedRows) as CsvImportResult<AppDataStore[T][number]> | null;
  }

  return parseWeeklyGoals(parsedRows) as CsvImportResult<AppDataStore[T][number]> | null;
}
