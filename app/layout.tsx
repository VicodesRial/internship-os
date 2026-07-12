import type { Metadata } from "next";
import { Geist, Geist_Mono, Silkscreen } from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";

import { AppShell } from "@/components/app-shell";
import { LegacyDataMigrationDialog } from "@/components/migration/legacy-data-migration-dialog";
import { AppDataProvider } from "@/components/providers/app-data-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ServiceWorkerRegistration } from "@/components/providers/service-worker-registration";
import { getCurrentAuthState } from "@/lib/auth/server";
import { listApplications } from "@/lib/data/applications";
import { listContacts, listTargetCompanies, listWeeklyGoals } from "@/lib/data/modules";

const geistSans = Geist({ display: "swap", subsets: ["latin"], variable: "--font-sans" });
const geistMono = Geist_Mono({ display: "swap", subsets: ["latin"], variable: "--font-mono" });
const silkscreen = Silkscreen({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-pixel",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Internship OS",
  description:
    "A polished internship application tracker built with Next.js, TypeScript, and Tailwind CSS.",
  applicationName: "Internship OS",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Internship OS",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-maskable.svg", type: "image/svg+xml", rel: "mask-icon" },
    ],
    apple: [{ url: "/icon.svg" }],
  },
};

export const viewport = {
  themeColor: "#090d12",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default async function RootLayout({ children }: RootLayoutProps) {
  const authState = await getCurrentAuthState();
  const [applicationResult, targetCompanyResult, contactResult, weeklyGoalResult] =
    authState.user
      ? await Promise.all([
          listApplications(),
          listTargetCompanies(),
          listContacts(),
          listWeeklyGoals(),
        ])
      : [
          { data: [], error: null },
          { data: [], error: null },
          { data: [], error: null },
          { data: [], error: null },
        ];

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${silkscreen.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{document.documentElement.classList.toggle('dark',localStorage.getItem('internship-os-theme')!=='light')}catch(e){document.documentElement.classList.add('dark')}",
          }}
        />
      </head>
      <body>
        <AuthProvider
          configured={authState.configured}
          initialProfile={authState.profile}
          initialUser={authState.user}
        >
          <AppDataProvider
            initialApplications={applicationResult.data ?? []}
            applicationLoadError={applicationResult.error}
            initialTargetCompanies={targetCompanyResult.data ?? []}
            initialContacts={contactResult.data ?? []}
            initialWeeklyGoals={weeklyGoalResult.data ?? []}
            moduleLoadErrors={{
              targetCompanies: targetCompanyResult.error,
              contacts: contactResult.error,
              weeklyGoals: weeklyGoalResult.error,
            }}
          >
            <ServiceWorkerRegistration />
            <AppShell>{children}</AppShell>
            <LegacyDataMigrationDialog />
          </AppDataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
