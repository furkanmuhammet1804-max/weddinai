import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Güvenlik başlıkları (tüm rotalar) — clickjacking/MIME-sniffing/HSTS.
  // CSP bilinçli olarak EKLENMEDİ: site içi YouTube iframe + Supabase storage +
  // inline stiller nedeniyle test edilmeden sıkı CSP siteyi bozabilir (ayrı,
  // dikkatli bir adımda eklenmeli).
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
        ],
      },
    ];
  },
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
