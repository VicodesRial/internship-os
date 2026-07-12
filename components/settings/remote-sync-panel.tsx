"use client";

import { useEffect, useState } from "react";

import { useAppData } from "@/components/providers/app-data-provider";
import {
  clearStoredSyncAccessToken,
  loadStoredSyncAccessToken,
  saveStoredSyncAccessToken,
} from "@/lib/sync-auth";
import type { AppDataStore } from "@/lib/types";

type RemoteSyncMetadata = {
  exportedAt: string | null;
  hasRemoteBackup: boolean;
  recordCounts: {
    applications: number;
    contacts: number;
    targetCompanies: number;
    weeklyGoals: number;
  } | null;
  updatedAt: string | null;
};

type SyncStatus =
  | {
      configured: true;
      metadata: RemoteSyncMetadata;
    }
  | {
      configured: false;
      message: string;
    };

const buttonClassName =
  "rounded-full border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60";

function formatTimestamp(value: string | null) {
  if (!value) {
    return "Not available";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleString();
}

export function RemoteSyncPanel() {
  const { exportBackupJson, replaceData } = useAppData();
  const [syncAccessToken, setSyncAccessToken] = useState("");
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<"success" | "error" | null>(
    null,
  );
  const [isChecking, setIsChecking] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [isPushing, setIsPushing] = useState(false);

  useEffect(() => {
    setSyncAccessToken(loadStoredSyncAccessToken());
  }, []);

  function setFeedback(message: string, tone: "success" | "error") {
    setFeedbackMessage(message);
    setFeedbackTone(tone);
  }

  function createRequestHeaders() {
    return {
      "Content-Type": "application/json",
      "x-sync-access-token": syncAccessToken.trim(),
    };
  }

  async function checkStatus() {
    if (syncAccessToken.trim() === "") {
      setFeedback("Save your sync access key before checking remote sync.", "error");
      return;
    }

    setIsChecking(true);

    try {
      const response = await fetch("/api/sync?metadata=1", {
        headers: createRequestHeaders(),
      });
      const payload = (await response.json()) as
        | { configured: true; metadata: RemoteSyncMetadata; message?: string }
        | { configured: false; message: string }
        | { configured: true; message: string };

      if (!response.ok) {
        const errorMessage =
          "message" in payload
            ? (payload.message ?? "Remote sync status request failed.")
            : "Remote sync status request failed.";

        setStatus(
          payload.configured
            ? null
            : {
                configured: false,
                message: errorMessage,
              },
        );
        setFeedback(errorMessage, "error");
        return;
      }

      if (!("metadata" in payload)) {
        setFeedback("Remote sync status response was invalid.", "error");
        return;
      }

      setStatus({
        configured: true,
        metadata: payload.metadata,
      });
      setFeedback("Remote sync status loaded successfully.", "success");
    } catch {
      setFeedback("Unable to reach the remote sync endpoint.", "error");
    } finally {
      setIsChecking(false);
    }
  }

  async function pullRemoteSnapshot() {
    if (syncAccessToken.trim() === "") {
      setFeedback("Save your sync access key before pulling remote data.", "error");
      return;
    }

    const confirmed = window.confirm(
      "Pull the remote snapshot and replace the current local tracker data on this device?",
    );

    if (!confirmed) {
      return;
    }

    setIsPulling(true);

    try {
      const response = await fetch("/api/sync", {
        headers: createRequestHeaders(),
      });
      const payload = (await response.json()) as
        | {
            configured: true;
            backup: {
              data: AppDataStore;
            };
            message?: string;
          }
        | { configured: boolean; message: string };

      if (!response.ok || !("backup" in payload)) {
        setFeedback(
          "message" in payload
            ? (payload.message ?? "Remote pull failed.")
            : "Remote pull failed.",
          "error",
        );
        return;
      }

      replaceData(payload.backup.data);
      await checkStatus();
      setFeedback("Remote snapshot pulled into local storage.", "success");
    } catch {
      setFeedback("Remote pull failed. Try again.", "error");
    } finally {
      setIsPulling(false);
    }
  }

  async function pushLocalSnapshot() {
    if (syncAccessToken.trim() === "") {
      setFeedback("Save your sync access key before pushing local data.", "error");
      return;
    }

    const confirmed = window.confirm(
      "Push the current local tracker snapshot to remote sync? This overwrites the previous remote backup.",
    );

    if (!confirmed) {
      return;
    }

    setIsPushing(true);

    try {
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: createRequestHeaders(),
        body: JSON.stringify({
          backupJson: exportBackupJson(),
        }),
      });
      const payload = (await response.json()) as
        | { configured: true; metadata: RemoteSyncMetadata; message?: string }
        | { configured: boolean; message: string };

      if (!response.ok || !("metadata" in payload)) {
        setFeedback(
          "message" in payload
            ? (payload.message ?? "Remote push failed.")
            : "Remote push failed.",
          "error",
        );
        return;
      }

      setStatus({
        configured: true,
        metadata: payload.metadata,
      });
      setFeedback("Current local tracker pushed to remote sync.", "success");
    } catch {
      setFeedback("Remote push failed. Try again.", "error");
    } finally {
      setIsPushing(false);
    }
  }

  return (
    <section className="command-panel p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-3xl">
          <p className="command-label">NETWORK_UPLINK // REMOTE_SYNC</p>
          <h2 className="font-pixel-heading mt-1 text-sm uppercase tracking-tight text-ink-900">
            Remote snapshot uplink
          </h2>
          <p className="mt-3 text-sm leading-6 text-ink-600 sm:text-base">
            Sync is optional and remains manual. Your browser still uses local
            storage by default, while this panel lets you push the current tracker
            to a protected remote snapshot or pull that snapshot onto another device.
          </p>
        </div>

        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-ink-600">
          Optional backend
        </div>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
            Local access key
          </p>
          <h3 className="mt-3 text-lg font-semibold text-ink-900">
            Save the sync key on this browser
          </h3>
          <p className="mt-3 text-sm leading-6 text-ink-600">
            The deployed server checks this key before allowing any remote sync
            reads or writes. Save it separately on each device you want to use.
          </p>

          <label className="mt-5 block text-sm font-medium text-ink-700">
            Sync access key
            <input
              type="password"
              value={syncAccessToken}
              onChange={(event) => setSyncAccessToken(event.target.value)}
              placeholder="Paste the sync access key"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink-900 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                saveStoredSyncAccessToken(syncAccessToken);
                setFeedback("Sync access key saved in this browser.", "success");
              }}
              className={`${buttonClassName} border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-300 hover:bg-blue-100`}
            >
              Save key
            </button>
            <button
              type="button"
              onClick={() => {
                clearStoredSyncAccessToken();
                setSyncAccessToken("");
                setStatus(null);
                setFeedback("Sync access key removed from this browser.", "success");
              }}
              className={`${buttonClassName} border-slate-200 bg-white text-ink-700 hover:border-slate-300 hover:bg-slate-100`}
            >
              Remove key
            </button>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={checkStatus}
              disabled={isChecking}
              className={`${buttonClassName} border-slate-200 bg-white text-ink-700 hover:border-slate-300 hover:bg-slate-100`}
            >
              {isChecking ? "Checking..." : "Check remote status"}
            </button>
            <button
              type="button"
              onClick={pullRemoteSnapshot}
              disabled={isPulling}
              className={`${buttonClassName} border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100`}
            >
              {isPulling ? "Pulling..." : "Pull remote snapshot"}
            </button>
            <button
              type="button"
              onClick={pushLocalSnapshot}
              disabled={isPushing}
              className={`${buttonClassName} border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-300 hover:bg-blue-100`}
            >
              {isPushing ? "Pushing..." : "Push local snapshot"}
            </button>
          </div>
        </div>

        <aside className="rounded-3xl border border-slate-200 bg-slate-900 p-5 text-slate-50">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Remote status
          </p>
          {status?.configured === false ? (
            <p className="mt-4 text-sm leading-6 text-slate-200">{status.message}</p>
          ) : (
            <>
              <p className="mt-4 text-sm leading-6 text-slate-200">
                {status?.configured
                  ? status.metadata.hasRemoteBackup
                    ? "A remote snapshot is available for pull operations."
                    : "Remote sync is configured, but no snapshot exists yet."
                  : "Check remote status after saving the sync access key."}
              </p>

              <div className="mt-5 space-y-3 text-sm leading-6 text-slate-300">
                <p>
                  Latest export:{" "}
                  <span className="font-semibold text-slate-100">
                    {status?.configured
                      ? formatTimestamp(status.metadata.exportedAt)
                      : "Not checked"}
                  </span>
                </p>
                <p>
                  Remote updated:{" "}
                  <span className="font-semibold text-slate-100">
                    {status?.configured
                      ? formatTimestamp(status.metadata.updatedAt)
                      : "Not checked"}
                  </span>
                </p>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                {[
                  [
                    "Applications",
                    status?.configured
                      ? status.metadata.recordCounts?.applications
                      : null,
                  ],
                  [
                    "Targets",
                    status?.configured
                      ? status.metadata.recordCounts?.targetCompanies
                      : null,
                  ],
                  [
                    "Contacts",
                    status?.configured
                      ? status.metadata.recordCounts?.contacts
                      : null,
                  ],
                  [
                    "Goals",
                    status?.configured
                      ? status.metadata.recordCounts?.weeklyGoals
                      : null,
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-white/10 bg-white/5 p-3"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      {label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      {value ?? "--"}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </aside>
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
          "Remote sync stays manual by design so you can choose when a device overwrites the shared snapshot."}
      </div>
    </section>
  );
}
