import Link from "next/link";

export default function OfflinePage() {
  return (
    <section className="command-panel p-4 sm:p-5">
      <div className="max-w-3xl">
        <p className="command-label">
          SYSTEM_STATUS // OFFLINE_MODE
        </p>
        <h1 className="font-pixel-display mt-1 text-xl uppercase tracking-tight text-ink-900">
          Network link interrupted
        </h1>
        <p className="mt-4 text-base leading-7 text-ink-600">
          Internship OS cannot reach Supabase right now. Account data and private
          routes require a connection and are intentionally not stored in the
          service-worker cache.
        </p>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
        <div className="rounded-sm border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
            Available offline
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-ink-700">
            <li>This network-status page</li>
            <li>Installed app icons and manifest metadata</li>
            <li>No cached API responses or private account pages</li>
          </ul>
        </div>

        <div className="rounded-sm border border-[var(--border-strong)] bg-[var(--card-soft)] p-4 text-slate-50">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Reconnect steps
          </p>
          <p className="mt-4 text-sm leading-6 text-slate-200">
            Once you are back online, refresh to restore your authenticated session
            and load the latest private records from Supabase.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
          >
            Return to dashboard
          </Link>
        </div>
      </div>
    </section>
  );
}
