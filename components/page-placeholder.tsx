import type { ReactNode } from "react";

type PagePlaceholderProps = {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
};

const previewItems = [
  "Clean tables and forms in later phases",
  "Local persistence with import and export support",
  "Dashboard metrics, deadlines, and application insights",
];

export function PagePlaceholder({
  eyebrow,
  title,
  description,
  children,
}: PagePlaceholderProps) {
  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
          {eyebrow}
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink-900">
          {title}
        </h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-ink-600">
          {description}
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.9fr)]">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-ink-500">Phase 1 Status</p>
              <h3 className="mt-2 text-xl font-semibold text-ink-900">
                Layout and navigation are ready
              </h3>
            </div>
            <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
              Working state
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {previewItems.map((item, index) => (
              <div
                key={item}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                  0{index + 1}
                </p>
                <p className="mt-3 text-sm leading-6 text-ink-700">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-slate-900 p-6 text-slate-50 shadow-sm">
          <p className="text-sm font-medium text-slate-300">Next up</p>
          <h3 className="mt-2 text-xl font-semibold">Data model and storage</h3>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            The next phase will add typed entities, demo data, local storage
            persistence, and JSON backup support.
          </p>

          <div className="mt-6 space-y-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                Planned foundation
              </p>
              <p className="mt-2 text-sm text-slate-100">
                Reusable utilities so every page can share the same data source.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                UX target
              </p>
              <p className="mt-2 text-sm text-slate-100">
                Keep the project publishable and deployable at every phase.
              </p>
            </div>
          </div>
        </div>
      </div>

      {children}
    </section>
  );
}
