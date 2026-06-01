// Türkçe-güvenli slug üretimi (ASCII'ye indirger).
const TR_HARITA: Record<string, string> = {
  ç: "c", Ç: "c", ğ: "g", Ğ: "g", ı: "i", İ: "i",
  ö: "o", Ö: "o", ş: "s", Ş: "s", ü: "u", Ü: "u",
};

export function slugYap(metin: string): string {
  return (metin || "")
    .replace(/[çÇğĞıİöÖşŞüÜ]/g, (c) => TR_HARITA[c] ?? c)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

// Kısa rastgele son ek (slug benzersizliği için).
export function kisaEk(uzunluk = 4): string {
  return Math.random().toString(36).slice(2, 2 + uzunluk);
}
