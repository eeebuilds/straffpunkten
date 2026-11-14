import type { MetadataRoute } from "next";

/** Gör sajten installerbar: på hemskärmen öppnas den som en app utan webbläsarfält. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Straffpunkten – dagens fotbollsquiz",
    short_name: "Straffpunkten",
    description: "Elva fotbollsfrågor varje dag. En straff per fråga, 20 sekunder på dig.",
    lang: "sv",
    start_url: "/?fran=hemskarm",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F4EBD9",
    theme_color: "#F4EBD9",
    categories: ["games", "sports"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
