export type NavLink = {
  href: string;
  label: string;
  shortLabel: string;
  description: string;
  icon: "home" | "apps" | "building" | "network" | "goals" | "settings";
};

export const navLinks: NavLink[] = [
  {
    href: "/",
    label: "Dashboard",
    shortLabel: "Home",
    description: "Overview and progress snapshot",
    icon: "home",
  },
  {
    href: "/applications",
    label: "Applications",
    shortLabel: "Apps",
    description: "Track every submission and status",
    icon: "apps",
  },
  {
    href: "/target-companies",
    label: "Target Companies",
    shortLabel: "Targets",
    description: "Prioritize companies and roles",
    icon: "building",
  },
  {
    href: "/networking",
    label: "Networking",
    shortLabel: "Contacts",
    description: "Manage outreach and referrals",
    icon: "network",
  },
  {
    href: "/weekly-goals",
    label: "Weekly Goals",
    shortLabel: "Goals",
    description: "Keep weekly execution measurable",
    icon: "goals",
  },
  {
    href: "/settings",
    label: "Settings",
    shortLabel: "Settings",
    description: "Preferences, data, and backups",
    icon: "settings",
  },
];
