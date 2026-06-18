import type { MetadataRoute } from "next";

const SITE = "https://weddinai-site.vercel.app";

// Herkese açık statik sayfalar. (Özel odalar/slayt indekslenmez.)
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const rota = (path: string, priority: number): MetadataRoute.Sitemap[number] => ({
    url: `${SITE}${path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority,
  });
  return [
    rota("/", 1),
    rota("/davetiye", 0.9),
    rota("/fiyatlar", 0.8),
    rota("/showroom", 0.8),
    rota("/musteri", 0.5),
    rota("/siparis", 0.6),
    rota("/kvkk", 0.3),
  ];
}
