import type { MetadataRoute } from "next";

// PWA manifest — ana ekrana eklemede WeddinAI ikonu ve marka renkleri.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WeddinAI — Etkinlik Anılarınız Tek Bir Bulutta",
    short_name: "WeddinAI",
    description:
      "Düğün, nişan, kına ve kurumsal etkinlikleriniz için QR ile fotoğraf, video ve anı toplama platformu.",
    start_url: "/",
    display: "standalone",
    background_color: "#1a0e16",
    theme_color: "#d2737a",
    lang: "tr",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
