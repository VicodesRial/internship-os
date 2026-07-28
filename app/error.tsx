"use client";

import Link from "next/link";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset(): void;
}) {
  return (
    <main className="grid min-h-[70vh] place-items-center px-5 py-12">
      <section className="command-panel w-full max-w-xl p-6 sm:p-8">
        <p className="command-label">SYSTEM_ERROR</p>
        <h1 className="font-pixel-heading mt-3 text-xl uppercase text-[var(--text)] sm:text-2xl">
          Mission interrupted
        </h1>
        <p className="mt-4 max-w-md text-sm leading-6 text-[var(--muted)]">
          The request could not be completed. Retry the operation or return to
          the dashboard.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-sm border border-blue-400/50 bg-blue-400/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-blue-200 hover:bg-blue-400/25"
          >
            Retry
          </button>
          <Link
            href="/"
            className="rounded-sm border border-[var(--line)] px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--text)] hover:bg-white/5"
          >
            Dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
