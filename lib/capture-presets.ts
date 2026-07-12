export type CapturePreset = "github" | "linkedin";

export const capturePresetContent: Record<
  CapturePreset,
  {
    canvasClassName: string;
    description: string;
    label: string;
    route: string;
  }
> = {
  github: {
    canvasClassName: "max-w-[1400px]",
    description:
      "Wide landscape framing for README hero images, repository previews, and desktop portfolio shots.",
    label: "GitHub README",
    route: "/capture/github",
  },
  linkedin: {
    canvasClassName: "max-w-[1120px]",
    description:
      "Tighter presentation framing for polished LinkedIn posts and portfolio showcase screenshots.",
    label: "LinkedIn Post",
    route: "/capture/linkedin",
  },
};

export function isCapturePreset(value: string): value is CapturePreset {
  return value === "github" || value === "linkedin";
}
