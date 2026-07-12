import { notFound } from "next/navigation";

import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import {
  capturePresetContent,
  isCapturePreset,
} from "@/lib/capture-presets";

type CapturePresetPageProps = {
  params: Promise<{
    preset: string;
  }>;
};

export default async function CapturePresetPage({
  params,
}: CapturePresetPageProps) {
  const { preset } = await params;

  if (!isCapturePreset(preset)) {
    notFound();
  }

  const presetContent = capturePresetContent[preset];

  return (
    <section className="command-center py-3 sm:py-4">
      <div
        className={`mx-auto ${presetContent.canvasClassName} rounded-sm border border-[var(--border-strong)] bg-[var(--page)] p-3 shadow-none sm:p-4 lg:p-5`}
      >
        <DashboardOverview presentationPreset={preset} />
      </div>
    </section>
  );
}
