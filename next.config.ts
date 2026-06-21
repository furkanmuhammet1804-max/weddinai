import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ana sayfa hero collage'ı için Unsplash düğün görselleri (next/image remote).
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  // pdfkit, runtime'da kendi font/veri dosyalarını okur → bundle yerine harici
  // paket olarak bırak ve serverless izlemeye gömülü Türkçe fontu dahil et.
  serverExternalPackages: ["pdfkit"],
  outputFileTracingIncludes: {
    "/api/admin/hatira/pdf": ["./assets/fonts/**"],
    "/api/admin/album/pdf": ["./assets/fonts/**"],
    // Lokal yüz tespiti pico kademe dosyasını runtime'da okur; serverless
    // izlemeye dahil et yoksa Vercel'de kategorileme sessizce çalışmaz.
    "/api/medya/otokategori": ["./assets/models/**"],
    "/api/admin/medya/analiz": ["./assets/models/**"],
  },
};

export default nextConfig;
