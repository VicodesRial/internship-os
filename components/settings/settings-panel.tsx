"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { LogoutButton } from "@/components/auth/logout-button";
import { useAppData } from "@/components/providers/app-data-provider";
import { useAuth } from "@/components/providers/auth-provider";
import { capturePresetContent } from "@/lib/capture-presets";
import {
  clearUserDataRequest,
  exportUserDataRequest,
  importUserDataRequest,
  replaceUserCollectionRequest,
  seedUserDemoDataRequest,
} from "@/lib/api/data-controls-client";
import { updateProfileRequest } from "@/lib/api/modules-client";
import {
  exportCollectionCsv,
  getCsvCollectionLabel,
  importCollectionCsv,
  type CsvCollectionKey,
} from "@/lib/csv";
import { parseAppDataBackup } from "@/lib/storage";

const actionButtonClassName =
  "rounded-full border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60";

const recordLabels = [
  { key: "applications", label: "Applications" },
  { key: "targetCompanies", label: "Target companies" },
  { key: "contacts", label: "Contacts" },
  { key: "weeklyGoals", label: "Weekly goals" },
] as const;

const csvCollections = [
  {
    key: "applications",
    description:
      "Round-trip application rows through Sheets or Excel without losing tracker metadata.",
  },
  {
    key: "targetCompanies",
    description:
      "Manage seasonal company planning in a spreadsheet, then sync the edited rows back.",
  },
  {
    key: "contacts",
    description:
      "Review networking outreach in table form and bulk-edit contact details offline.",
  },
  {
    key: "weeklyGoals",
    description:
      "Adjust weekly execution targets in CSV form and re-import the updated plan.",
  },
] satisfies { key: CsvCollectionKey; description: string }[];

function createExportFileName() {
  const date = new Date().toISOString().slice(0, 10);

  return `internship-tracker-backup-${date}.json`;
}

function createCollectionCsvFileName(collectionKey: CsvCollectionKey) {
  const date = new Date().toISOString().slice(0, 10);

  return `internship-tracker-${collectionKey}-${date}.csv`;
}

export function SettingsPanel() {
  const router = useRouter();
  const { profile, user } = useAuth();
  const {
    applicationLoadError,
    cloudError,
    data,
    hasHydrated,
    moduleLoadErrors,
    recordCounts,
  } = useAppData();

  const jsonFileInputRef = useRef<HTMLInputElement | null>(null);
  const csvFileInputRef = useRef<HTMLInputElement | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<"success" | "error" | null>(
    null,
  );
  const [isImporting, setIsImporting] = useState(false);
  const [isCsvImporting, setIsCsvImporting] = useState(false);
  const [isDataActionPending, setIsDataActionPending] = useState(false);
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");
  const [csvImportCollection, setCsvImportCollection] =
    useState<CsvCollectionKey | null>(null);
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => setDisplayName(profile?.display_name ?? ""), [profile?.display_name]);

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingProfile(true);
    const result = await updateProfileRequest(displayName);
    setIsSavingProfile(false);
    if (result.data === null) {
      setFeedback(result.error, "error");
      return;
    }
    setFeedback("Account profile updated.", "success");
    router.refresh();
  }

  const syncError = applicationLoadError ?? Object.values(moduleLoadErrors).find(Boolean) ?? cloudError;

  function setFeedback(message: string, tone: "success" | "error") {
    setFeedbackMessage(message);
    setFeedbackTone(tone);
  }

  async function handleExport() {
    setIsDataActionPending(true);
    const result = await exportUserDataRequest();
    setIsDataActionPending(false);
    if (result.data === null) {
      setFeedback(result.error, "error");
      return;
    }
    const backupJson = JSON.stringify(result.data, null, 2);
    const file = new Blob([backupJson], { type: "application/json" });
    const objectUrl = URL.createObjectURL(file);
    const link = document.createElement("a");

    link.href = objectUrl;
    link.download = createExportFileName();
    link.click();

    URL.revokeObjectURL(objectUrl);

    setFeedback("JSON backup downloaded successfully.", "success");
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setIsImporting(true);

    try {
      const input = await file.text();
      const backup = parseAppDataBackup(input);
      if (!backup) {
        setFeedback(
          "Import failed. Select a valid internship tracker backup JSON file.",
          "error",
        );
        return;
      }
      const verb = importMode === "replace" ? "replace all current account data with" : "merge into your account";
      if (!window.confirm(`Import this backup and ${verb}? This operation only affects the signed-in account.`)) return;
      const result = await importUserDataRequest(backup, importMode);
      if (result.data === null) {
        setFeedback(result.error, "error");
        return;
      }
      setFeedback(`Backup ${importMode === "replace" ? "restored" : "merged"} successfully.`, "success");
      router.refresh();
    } catch {
      setFeedback(
        "Import failed while reading the selected file. Try again.",
        "error",
      );
    } finally {
      setIsImporting(false);
      event.target.value = "";
    }
  }

  async function handleReset() {
    const confirmed = window.confirm(
      "Replace all data in your account with the demo dataset? This cannot be undone unless you export a backup first.",
    );

    if (!confirmed) {
      return;
    }

    setIsDataActionPending(true);
    const result = await seedUserDemoDataRequest();
    setIsDataActionPending(false);
    if (result.data === null) {
      setFeedback(result.error, "error");
      return;
    }
    setFeedback("Demo data seeded into your account.", "success");
    router.refresh();
  }

  async function handleDeleteMyData() {
    if (!window.confirm("Permanently delete all applications, target companies, contacts, and weekly goals in your account? Your login and profile will remain.")) return;
    setIsDataActionPending(true);
    const result = await clearUserDataRequest();
    setIsDataActionPending(false);
    if (result.data === null) {
      setFeedback(result.error, "error");
      return;
    }
    setFeedback("All tracker records in your account were deleted.", "success");
    router.refresh();
  }

  return (
    <div className="settings-console space-y-4">
      <section className="command-panel p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="command-label">MODULE_06 // SYSTEM_CONFIG</p>
            <h1 className="font-pixel-display mt-1 text-xl uppercase tracking-tight text-ink-900">
              System Configuration
            </h1>
            <p className="mt-3 text-sm leading-6 text-ink-600 sm:text-base">
              Your private tracker data is stored in Supabase and follows your
              authenticated account across devices.
            </p>
          </div>

          <div className="rounded-sm border border-[var(--border-strong)] bg-[var(--accent-soft)] px-4 py-3 text-xs text-[var(--text)] lg:max-w-xs">
            <p className="command-label">
              SYNC_STATUS
            </p>
            <p className="mt-2 text-lg font-semibold">
              {syncError ? "Sync needs attention" : "Cloud database"}
            </p>
            <p className="mt-2 leading-6 text-[var(--muted)]">
              {syncError ?? "Applications, target companies, contacts, and weekly goals are loaded from your private account."}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden border border-[var(--border)] bg-[var(--border)] xl:grid-cols-4">
          {recordLabels.map((item) => (
            <div
              key={item.key}
              className="bg-[var(--card-soft)] p-3"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                {item.label}
              </p>
              <p className="mt-1 font-mono text-xl font-semibold tracking-tight text-ink-900">
                {recordCounts[item.key]}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="command-panel p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="command-label">ACCOUNT</p>
            <h2 className="font-pixel-heading mt-1 text-sm uppercase tracking-tight text-ink-900">Operator profile</h2>
            <p className="mt-3 text-sm leading-6 text-ink-600">Manage the identity attached to this private Internship OS workspace.</p>
          </div>
          <div className={`rounded-full border px-3 py-1 text-sm font-semibold ${syncError ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
            {syncError ? "Database error" : "Synced to Supabase"}
          </div>
        </div>
        <form onSubmit={handleProfileSubmit} className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-ink-700">
            Email
            <input value={user?.email ?? profile?.email ?? ""} disabled className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-ink-500" />
          </label>
          <label className="text-sm font-medium text-ink-700">
            Display name
            <input value={displayName} maxLength={100} onChange={(event) => setDisplayName(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-ink-900" />
          </label>
          <div className="flex items-center gap-3 md:col-span-2">
            <button type="submit" disabled={isSavingProfile} className={`${actionButtonClassName} border-blue-200 bg-blue-50 text-blue-700`}>
              {isSavingProfile ? "Saving..." : "Save profile"}
            </button>
            <LogoutButton />
          </div>
        </form>
      </section>

      <section>
        <div className="command-panel p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="command-label">DATA_CORE</p>
              <h2 className="font-pixel-heading mt-1 text-sm uppercase tracking-tight text-ink-900">
                Backup and restore
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-600 sm:text-base">
                Export only your authenticated records, or merge and replace them
                from a validated, versioned backup.
              </p>
            </div>

            <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
              {hasHydrated ? "Ready" : "Loading"}
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                Export backup
              </p>
              <h3 className="mt-3 text-lg font-semibold text-ink-900">
                Download your current data
              </h3>
              <p className="mt-3 text-sm leading-6 text-ink-600">
                Saves a timestamped JSON file you can keep in GitHub, iCloud, or
                another local folder.
              </p>
              <button
                type="button"
                onClick={handleExport}
                disabled={!hasHydrated || isDataActionPending}
                className={`${actionButtonClassName} mt-5 border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-300 hover:bg-blue-100`}
              >
                Export JSON
              </button>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                Import backup
              </p>
              <h3 className="mt-3 text-lg font-semibold text-ink-900">
                Restore a saved snapshot
              </h3>
              <p className="mt-3 text-sm leading-6 text-ink-600">
                Merge without deleting existing records, or replace all tracker
                records in this account transactionally.
              </p>
              <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.14em] text-ink-500">
                Import behavior
                <select value={importMode} onChange={(event) => setImportMode(event.target.value as "merge" | "replace")} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm normal-case tracking-normal text-ink-700">
                  <option value="merge">Merge records</option>
                  <option value="replace">Replace account data</option>
                </select>
              </label>
              <input
                ref={jsonFileInputRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={handleImport}
              />
              <button
                type="button"
                onClick={() => jsonFileInputRef.current?.click()}
                disabled={!hasHydrated || isImporting || isDataActionPending}
                className={`${actionButtonClassName} mt-5 border-slate-200 bg-white text-ink-700 hover:border-slate-300 hover:bg-slate-100`}
              >
                {isImporting ? "Importing..." : "Import JSON"}
              </button>
            </article>

            <article className="rounded-3xl border border-rose-200 bg-rose-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-500">
                Reset demo data
              </p>
              <h3 className="mt-3 text-lg font-semibold text-ink-900">
                Restore the seeded portfolio view
              </h3>
              <p className="mt-3 text-sm leading-6 text-ink-600">
                Seeds demo records into only your account after confirmation. Your
                current tracker records are replaced transactionally.
              </p>
              <button
                type="button"
                onClick={handleReset}
                disabled={!hasHydrated || isDataActionPending}
                className={`${actionButtonClassName} mt-5 border-rose-200 bg-white text-rose-700 hover:border-rose-300 hover:bg-rose-100`}
              >
                Seed demo data
              </button>
            </article>

            <article className="rounded-3xl border border-rose-300 bg-rose-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-600">Delete my data</p>
              <h3 className="mt-3 text-lg font-semibold text-ink-900">Clear tracker records</h3>
              <p className="mt-3 text-sm leading-6 text-ink-600">Permanently deletes your applications, companies, contacts, and goals. Your account remains active.</p>
              <button type="button" onClick={handleDeleteMyData} disabled={!hasHydrated || isDataActionPending} className={`${actionButtonClassName} mt-5 border-rose-300 bg-white text-rose-700 hover:bg-rose-100`}>
                Delete my data
              </button>
            </article>
          </div>

          <div
            className={`mt-6 rounded-3xl border px-4 py-3 text-sm leading-6 ${
              feedbackTone === "error"
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : feedbackTone === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-slate-50 text-ink-500"
            }`}
          >
            {feedbackMessage ??
              "Tip: export a backup before importing a different dataset or resetting the app."}
          </div>
        </div>

      </section>

      <section className="command-panel p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-3xl">
            <p className="command-label">DATA_TRANSFER</p>
            <h2 className="font-pixel-heading mt-1 text-sm uppercase tracking-tight text-ink-900">
              Collection transfer console
            </h2>
            <p className="mt-3 text-sm leading-6 text-ink-600 sm:text-base">
              CSV is optimized for spreadsheet editing. Export a collection, make
              bulk changes in Excel or Google Sheets, then import the same shape
              back to replace that collection only.
            </p>
          </div>

          <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-ink-600">
            Collection-safe import
          </div>
        </div>

        <input
          ref={csvFileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={async (event) => {
            const file = event.target.files?.[0];

            if (!file || !csvImportCollection) {
              return;
            }

            setIsCsvImporting(true);

            try {
              const input = await file.text();
              const importedCollection = importCollectionCsv(csvImportCollection, input);

              if (!importedCollection) {
                setFeedback(
                  `CSV import failed for ${getCsvCollectionLabel(
                    csvImportCollection,
                  ).toLowerCase()}. Use a file exported from this app or keep the same column names and valid values.`,
                  "error",
                );
                return;
              }

              if (!window.confirm(`Replace the ${getCsvCollectionLabel(csvImportCollection).toLowerCase()} collection in your account with ${importedCollection.count} CSV records?`)) return;
              const result = await replaceUserCollectionRequest(
                csvImportCollection,
                importedCollection.records,
              );
              if (result.data === null) {
                setFeedback(result.error, "error");
                return;
              }

              setFeedback(
                `Imported ${importedCollection.count} ${getCsvCollectionLabel(
                  csvImportCollection,
                ).toLowerCase()} from CSV.`,
                "success",
              );
              router.refresh();
            } catch {
              setFeedback(
                "CSV import failed while reading the selected file. Try again.",
                "error",
              );
            } finally {
              setIsCsvImporting(false);
              setCsvImportCollection(null);
              event.target.value = "";
            }
          }}
        />

        <div className="mt-8 grid gap-4 xl:grid-cols-2">
          {csvCollections.map((collection) => (
            <article
              key={collection.key}
              className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                    {getCsvCollectionLabel(collection.key)}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-ink-600">
                    {collection.description}
                  </p>
                </div>

                <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-ink-500">
                  {recordCounts[collection.key]} records
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={!hasHydrated}
                  onClick={() => {
                    const csv = exportCollectionCsv(collection.key, data[collection.key]);
                    const file = new Blob([csv], { type: "text/csv;charset=utf-8" });
                    const objectUrl = URL.createObjectURL(file);
                    const link = document.createElement("a");

                    link.href = objectUrl;
                    link.download = createCollectionCsvFileName(collection.key);
                    link.click();

                    URL.revokeObjectURL(objectUrl);

                    setFeedback(
                      `${getCsvCollectionLabel(collection.key)} CSV downloaded successfully.`,
                      "success",
                    );
                  }}
                  className={`${actionButtonClassName} border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-300 hover:bg-blue-100`}
                >
                  Export CSV
                </button>

                <button
                  type="button"
                  disabled={!hasHydrated || isCsvImporting || isDataActionPending}
                  onClick={() => {
                    setCsvImportCollection(collection.key);
                    csvFileInputRef.current?.click();
                  }}
                  className={`${actionButtonClassName} border-slate-200 bg-white text-ink-700 hover:border-slate-300 hover:bg-slate-100`}
                >
                  {isCsvImporting && csvImportCollection === collection.key ? "Importing..." : "Import CSV"}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="command-panel p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-3xl">
            <p className="command-label">DISPLAY_CAPTURE</p>
            <h2 className="font-pixel-heading mt-1 text-sm uppercase tracking-tight text-ink-900">
              Capture presets
            </h2>
            <p className="mt-3 text-sm leading-6 text-ink-600 sm:text-base">
              These preset routes remove the normal app chrome and frame the
              dashboard for sharing. Open one in a new tab, wait for hydration, then
              capture the page with your browser or operating system screenshot tool.
            </p>
          </div>

          <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-ink-600">
            No extra dependency
          </div>
        </div>

        <div className="mt-8 grid gap-4 xl:grid-cols-2">
          {Object.entries(capturePresetContent).map(([presetKey, preset]) => (
            <article
              key={presetKey}
              className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                {preset.label}
              </p>
              <h3 className="mt-3 text-lg font-semibold text-ink-900">
                {presetKey === "github"
                  ? "Landscape repository showcase"
                  : "Focused social-share framing"}
              </h3>
              <p className="mt-3 text-sm leading-6 text-ink-600">
                {preset.description}
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={preset.route}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
                >
                  Open preset
                </Link>
                <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-ink-600">
                  {preset.route}
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

    </div>
  );
}
