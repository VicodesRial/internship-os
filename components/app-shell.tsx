"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { navLinks } from "@/components/nav-links";
import { LogoutButton } from "@/components/auth/logout-button";
import { useAuth } from "@/components/providers/auth-provider";
import { SidebarNav } from "@/components/sidebar-nav";
import { Icon } from "@/components/ui/icon";

type Theme = "light" | "dark";

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
      <span className="relative grid h-9 w-9 place-items-center rounded-sm border border-[var(--accent)] bg-[var(--accent-soft)] font-mono text-xs font-bold text-[var(--accent)]"><span className="absolute left-0 top-0 h-1 w-1 bg-[var(--accent)]" />IO</span>
      <span>
        <span className="font-pixel-display block text-xs uppercase tracking-[0.06em] text-[var(--text)]">Internship_OS</span>
        <span className="font-pixel-label block text-[8px] uppercase tracking-[0.06em] text-[var(--muted)]">Mission Control v1.0</span>
      </span>
    </Link>
  );
}

function Profile() {
  const { account, profile } = useAuth();
  const displayName = profile?.display_name || account?.email.split("@")[0] || "Operator";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="flex items-center gap-3 rounded-sm border border-[var(--border)] bg-[var(--card-soft)] p-2.5">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-sm border border-[var(--border-strong)] bg-[var(--accent-soft)] font-mono text-[10px] font-semibold text-[var(--accent)]">{initials}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-mono text-[11px] font-medium uppercase tracking-wide text-[var(--text)]">{displayName}</span>
        <span className="block truncate font-mono text-[9px] uppercase text-[var(--muted)]">Cloud authenticated</span>
      </span>
      <LogoutButton />
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("light");
  const { account, profile } = useAuth();
  const isCaptureRoute = pathname.startsWith("/capture/");
  const isAuthRoute = ["/login", "/signup", "/forgot-password", "/reset-password"].includes(pathname);
  const displayName = profile?.display_name || account?.email.split("@")[0] || "Operator";
  const initials = displayName.slice(0, 2).toUpperCase();
  const activeModule = navLinks.find((link) => link.href === "/" ? pathname === "/" : pathname.startsWith(link.href))?.label ?? "Overview";

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("internship-os-theme");
    const initialTheme = savedTheme === "light" ? "light" : "dark";
    setTheme(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    window.localStorage.setItem("internship-os-theme", nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  }

  if (isCaptureRoute) {
    return <main className="mx-auto min-h-screen w-full max-w-[1680px] px-4 py-5 sm:px-6 lg:px-8">{children}</main>;
  }

  if (isAuthRoute) {
    return (
      <div className="command-center min-h-screen bg-[var(--page)] px-4 py-8 text-[var(--text)]">
        <div className="mx-auto mb-8 w-full max-w-md"><Brand /></div>
        <main className="mx-auto grid w-full place-items-center">{children}</main>
      </div>
    );
  }

  return (
    <div className="command-center min-h-screen bg-[var(--page)] text-[var(--text)] transition-colors">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[var(--sidebar-width)] border-r border-[var(--border)] bg-[var(--sidebar)] px-3 py-4 lg:flex lg:flex-col">
        <div className="px-2"><Brand /></div>
        <div className="font-pixel-label mt-7 flex items-center gap-2 px-2 text-[8px] uppercase tracking-[0.08em] text-[var(--muted)]"><span>MODULE_INDEX</span><span className="h-px flex-1 bg-[var(--border)]" /></div>
        <div className="mt-2 flex flex-1 flex-col"><SidebarNav /></div>
        <div className="mt-4 space-y-3">
          <div className="rounded-sm border border-[var(--border)] bg-[var(--card-soft)] px-3 py-3">
            <div className="font-pixel-label flex items-center justify-between text-[8px] uppercase tracking-[0.04em]"><span className="text-[var(--muted)]">SYSTEM_STATUS</span><span className="flex items-center gap-1.5 text-[var(--success)]"><span className="status-pulse h-1.5 w-1.5 bg-[var(--success)]" />Online</span></div>
            <div className="mt-2.5 grid grid-cols-8 gap-1">{Array.from({ length: 8 }).map((_, index) => <span key={index} className="h-1 bg-[var(--success)] opacity-70" />)}</div>
          </div>
          <Profile />
        </div>
      </aside>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Close navigation" onClick={() => setDrawerOpen(false)} className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" />
          <aside className="relative flex h-full w-[min(88vw,300px)] flex-col border-r border-[var(--border)] bg-[var(--sidebar)] p-4 shadow-2xl">
            <div className="flex items-center justify-between px-2"><Brand /><button type="button" aria-label="Close menu" onClick={() => setDrawerOpen(false)} className="icon-button"><Icon name="close" className="h-5 w-5" /></button></div>
            <div className="mt-8 flex flex-1 flex-col"><SidebarNav onNavigate={() => setDrawerOpen(false)} /></div>
            <Profile />
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-[var(--sidebar-width)]">
        <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[color:var(--header)] backdrop-blur-sm">
          <div className="mx-auto flex h-14 max-w-[var(--content-max)] items-center gap-2.5 px-4 sm:px-5 lg:px-6">
            <button type="button" aria-label="Open navigation" onClick={() => setDrawerOpen(true)} className="icon-button lg:hidden"><Icon name="menu" className="h-5 w-5" /></button>
            <div className="min-w-0 flex-1">
              <p className="font-pixel-label truncate text-[10px] uppercase tracking-[0.05em] text-[var(--text)]">{activeModule}</p>
              <p className="hidden font-mono text-[9px] uppercase tracking-wider text-[var(--muted)] sm:block">SYS / MODULE / {activeModule}</p>
            </div>
            <Link href="/applications" className="group hidden h-9 w-full max-w-[250px] items-center gap-2 rounded-sm border border-[var(--border)] bg-[var(--card-soft)] px-3 font-mono text-[10px] uppercase tracking-wide text-[var(--muted)] transition hover:border-[var(--accent)] sm:flex"><Icon name="search" className="h-3.5 w-3.5" /><span className="flex-1">Search database<span className="status-pulse ml-0.5 text-[var(--accent)]">_</span></span><kbd className="border border-[var(--border)] px-1.5 py-0.5 text-[8px]">⌘K</kbd></Link>
            <button type="button" aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`} onClick={toggleTheme} className="icon-button"><Icon name={theme === "light" ? "moon" : "sun"} className="h-[18px] w-[18px]" /></button>
            <Link href="/applications?new=1" className="font-pixel-label inline-flex min-h-9 items-center gap-2 rounded-sm bg-slate-900 px-3 text-[9px] uppercase tracking-[0.03em] text-white transition hover:bg-slate-800 active:translate-y-px"><Icon name="plus" className="h-3.5 w-3.5" /><span className="hidden sm:inline">New Mission</span></Link>
            <span className="grid h-8 w-8 place-items-center rounded-sm border border-[var(--border-strong)] bg-[var(--accent-soft)] font-mono text-[9px] font-semibold text-[var(--accent)]">{initials}</span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[var(--content-max)] px-3 py-4 sm:px-5 lg:px-6 lg:py-5">{children}</main>
      </div>
    </div>
  );
}
