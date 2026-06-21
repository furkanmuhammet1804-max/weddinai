import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfkit, runtime'da kendi font/veri dosyalarını okur → bundle yerine harici
  // paket olarak bırak ve serverless izlemeye gömülü Türkçe fontu dahil et.
  serverExternalPackages: ["pdfkit"],
  outputFileTracingIncludes: {
    "/api/admin/hatira/pdf": ["./assets/fonts/**"],
    "/api/admin/album/pdf": ["./assets/fonts/**"],
  },
};

export default nextConfig;
