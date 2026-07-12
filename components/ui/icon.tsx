import type { SVGProps } from "react";

export type IconName =
  | "apps"
  | "building"
  | "calendar"
  | "chart"
  | "chevron"
  | "close"
  | "goals"
  | "home"
  | "menu"
  | "moon"
  | "network"
  | "plus"
  | "search"
  | "settings"
  | "sun";

const paths: Record<IconName, React.ReactNode> = {
  apps: <><rect x="3" y="4" width="18" height="16" rx="3" /><path d="M8 2v4m8-4v4M3 10h18" /></>,
  building: <><path d="M4 21V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v16M9 7h3m-3 4h3m-3 4h3m5-6h2a2 2 0 0 1 2 2v10H3" /></>,
  calendar: <><rect x="3" y="4" width="18" height="17" rx="3" /><path d="M8 2v4m8-4v4M3 10h18" /></>,
  chart: <><path d="M4 20V10m6 10V4m6 16v-7m4 7H2" /></>,
  chevron: <path d="m9 18 6-6-6-6" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  goals: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><path d="m15 9-3 3" /></>,
  home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10M9 20v-6h6v6" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  moon: <path d="M20.5 15.5A8.5 8.5 0 0 1 8.5 3.5a9 9 0 1 0 12 12Z" />,
  network: <><circle cx="12" cy="6" r="3" /><circle cx="5" cy="18" r="3" /><circle cx="19" cy="18" r="3" /><path d="m10 9-3.5 6m7.5-6 3.5 6M8 18h8" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
};

export function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>;
}
