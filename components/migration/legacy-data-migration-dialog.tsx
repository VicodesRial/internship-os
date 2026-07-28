"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/providers/auth-provider";
import { migrateLegacyDataRequest } from "@/lib/api/legacy-migration-client";
import {
  countRecords,
  createLegacyDataFingerprint,
  getMeaningfulLegacyData,
  hasStoredAppData,
  loadStoredAppData,
  removeStoredAppData,
} from "@/lib/storage";
import type { AppDataStore, AppRecordCounts } from "@/lib/types";

type SuccessState = { alreadyMigrated: boolean; counts: AppRecordCounts };

export function LegacyDataMigrationDialog() {
  const router = useRouter();
  const { account, profile } = useAuth();
  const checkedPayloadRef = useRef<string | null>(null);
  const [legacyData, setLegacyData] = useState<AppDataStore | null>(null);
  const [hasLegacyCopy, setHasLegacyCopy] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [deleteAfterImport, setDeleteAfterImport] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SuccessState | null>(null);
  const [dismissalKey, setDismissalKey] = useState<string | null>(null);

  useEffect(() => {
    if (!account || !profile || profile.legacy_migrated_at) return;
    if (!hasStoredAppData()) return;
    const stored = loadStoredAppData();
    const meaningfulData = getMeaningfulLegacyData(stored);
    if (!meaningfulData) return;

    const fingerprint = createLegacyDataFingerprint(meaningfulData);
    const nextDismissalKey = `internship-os-legacy-migration-dismissed:${account.id}:${fingerprint}`;
    if (window.localStorage.getItem(nextDismissalKey) === "true") return;
    if (checkedPayloadRef.current === nextDismissalKey) return;
    checkedPayloadRef.current = nextDismissalKey;

    setHasLegacyCopy(true);
    setLegacyData(meaningfulData);
    setDismissalKey(nextDismissalKey);
    setError(null);
    setIsOpen(true);
  }, [account, profile]);

  if (!isOpen || !account || !hasLegacyCopy) return null;

  const counts = legacyData
    ? countRecords(legacyData)
    : { applications: 0, targetCompanies: 0, contacts: 0, weeklyGoals: 0 };
  const totalRecords = Object.values(counts).reduce((sum, count) => sum + count, 0);

  function dismissLegacyData() {
    if (dismissalKey) window.localStorage.setItem(dismissalKey, "true");
    setIsOpen(false);
  }

  async function importLegacyData() {
    if (!legacyData || totalRecords === 0) return;
    setError(null);
    setIsImporting(true);
    const result = await migrateLegacyDataRequest(legacyData);
    setIsImporting(false);
    if (result.data === null) {
      setError(result.error);
      return;
    }
    if (deleteAfterImport) removeStoredAppData();
    setSuccess({ alreadyMigrated: result.data.alreadyMigrated, counts: result.data.recordCounts });
  }

  function finishMigration() {
    setIsOpen(false);
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/75 p-4 backdrop-blur-sm">
      <section role="dialog" aria-modal="true" aria-labelledby="legacy-migration-title" className="command-panel max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto p-5 sm:p-7">
        <p className="command-label">LOCAL_DATA_DETECTED</p>
        <h2 id="legacy-migration-title" className="font-pixel-display mt-2 text-lg uppercase tracking-tight text-ink-900">
          {success ? "Migration complete" : "Move your browser data to the cloud"}
        </h2>

        {success ? (
          <div className="mt-5 space-y-5">
            <p className="text-sm leading-6 text-ink-600">
              {success.alreadyMigrated
                ? "This account had already completed migration. No duplicate records were created."
                : "Your validated records are now stored in your private Supabase account."}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {Object.entries(success.counts).map(([key, value]) => (
                <div key={key} className="rounded-sm border border-[var(--border)] bg-[var(--card-soft)] p-3">
                  <p className="font-mono text-xl font-semibold text-ink-900">{value}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-wide text-ink-500">{key}</p>
                </div>
              ))}
            </div>
            <button type="button" onClick={finishMigration} className="font-pixel-label rounded-sm bg-[var(--accent)] px-4 py-3 text-[9px] uppercase text-white">
              Continue to Internship OS
            </button>
          </div>
        ) : (
          <div className="mt-5 space-y-5">
            <p className="text-sm leading-6 text-ink-600">
              Internship OS found a legacy dataset saved in this browser. Nothing will be uploaded unless you confirm. Imported records belong only to <span className="font-semibold text-ink-900">{account.email}</span>.
            </p>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {Object.entries(counts).map(([key, value]) => (
                <div key={key} className="rounded-sm border border-[var(--border)] bg-[var(--card-soft)] p-3">
                  <p className="font-mono text-xl font-semibold text-ink-900">{value}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-wide text-ink-500">{key}</p>
                </div>
              ))}
            </div>

            {error ? <div role="alert" className="rounded-sm border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}

            <label className="flex items-start gap-3 text-sm leading-6 text-ink-600">
              <input type="checkbox" checked={deleteAfterImport} onChange={(event) => setDeleteAfterImport(event.target.checked)} className="mt-1" />
              Delete the local browser copy only after the cloud import succeeds.
            </label>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button type="button" onClick={importLegacyData} disabled={isImporting || totalRecords === 0} className="font-pixel-label rounded-sm bg-[var(--accent)] px-4 py-3 text-[9px] uppercase text-white disabled:cursor-not-allowed disabled:opacity-50">
                {isImporting ? "Importing..." : `Import ${totalRecords} records`}
              </button>
              <button type="button" onClick={dismissLegacyData} disabled={isImporting} className="font-pixel-label rounded-sm border border-[var(--border)] px-4 py-3 text-[9px] uppercase text-ink-600 disabled:opacity-50">
                Dismiss this data
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
