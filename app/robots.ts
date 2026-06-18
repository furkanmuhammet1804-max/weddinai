import type { MetadataRoute } from "next";

const SITE = "https://weddinai-site.vercel.app";

// Özel alanlar (yönetim, API, müşteri odaları, slayt) indekslenmesin.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/oda", "/slayt", "/e/"],
    },
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
