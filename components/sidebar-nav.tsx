"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { navLinks } from "@/components/nav-links";
import { Icon } from "@/components/ui/icon";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary navigation" className="flex flex-1 flex-col gap-1">
      {navLinks.map((link, index) => {
        const active = isActive(pathname, link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`font-pixel-label group relative flex min-h-10 items-center gap-2.5 rounded-sm border px-2.5 py-2 text-[9px] uppercase tracking-[0.03em] transition-colors ${
              active
                ? "border-[var(--border-strong)] bg-[var(--accent-soft)] text-[var(--accent)]"
                : "border-transparent text-[var(--muted)] hover:border-[var(--border)] hover:bg-[var(--card-soft)] hover:text-[var(--text)]"
            }`}
          >
            {active ? <span className="absolute -left-[13px] h-5 w-0.5 bg-[var(--accent)]" /> : null}
            <span className="w-5 text-[8px] text-[#586679]">{String(index + 1).padStart(2, "0")}</span>
            <Icon name={link.icon} className="h-3.5 w-3.5 shrink-0" />
            <span className="min-w-0 flex-1 truncate">{link.label}</span>
            {active ? <span className="status-pulse h-1.5 w-1.5 bg-[var(--accent)]" /> : null}
          </Link>
        );
      })}
    </nav>
  );
}
