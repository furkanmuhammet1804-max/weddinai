// Etkinlik türü → Türkçe etiket (DB enum'una birebir, mock'tan bağımsız).
export const ETKINLIK_TURU_ETIKET: Record<string, string> = {
  dugun: "Düğün",
  nisan: "Nişan",
  kina: "Kına Gecesi",
  kurumsal_gala: "Kurumsal Gala",
  dogum_gunu: "Doğum Günü",
  parti: "Parti",
  diger: "Etkinlik",
};

export function turEtiket(tur: string | null | undefined): string {
  if (!tur) return "Etkinlik";
  return ETKINLIK_TURU_ETIKET[tur] ?? "Etkinlik";
}

// "2026-08-15" → "15 Ağustos 2026" (tarih yoksa boş).
const AYLAR = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

export function tarihTR(iso: string | null | undefined): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map((x) => parseInt(x, 10));
  if (!y || !m || !d) return "";
  return `${d} ${AYLAR[m - 1] ?? ""} ${y}`.trim();
}
