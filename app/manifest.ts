import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Internship Tracker Dashboard",
    short_name: "Internship Tracker",
    description:
      "A polished internship application tracker with dashboard analytics, local persistence, and offline-ready navigation.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#eff6ff",
    orientation: "portrait",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
