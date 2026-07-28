export const MAX_IMPORT_FILE_BYTES = 1024 * 1024;

export type ImportFileKind = "csv" | "json";

type ImportFileMetadata = {
  name: string;
  size: number;
  type: string;
};

const allowedMimeTypes: Record<ImportFileKind, ReadonlySet<string>> = {
  csv: new Set([
    "",
    "application/csv",
    "application/octet-stream",
    "application/vnd.ms-excel",
    "text/csv",
    "text/plain",
  ]),
  json: new Set([
    "",
    "application/json",
    "application/octet-stream",
    "text/json",
    "text/plain",
  ]),
};

export function validateImportFile(
  file: ImportFileMetadata,
  kind: ImportFileKind,
): string | null {
  if (file.size <= 0) {
    return "The selected file is empty.";
  }

  if (file.size > MAX_IMPORT_FILE_BYTES) {
    return "The selected file is larger than the 1 MB import limit.";
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension !== kind) {
    return `Select a .${kind} file.`;
  }

  const normalizedMimeType = file.type.toLowerCase().split(";")[0].trim();
  if (!allowedMimeTypes[kind].has(normalizedMimeType)) {
    return `The selected file is not recognized as ${kind.toUpperCase()}.`;
  }

  return null;
}
