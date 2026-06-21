// =============================================================
// Dijital Albüm — paylaşılan sabitler (Özellik 5 revizyonu). Sunucu-only import yok.
// Albüm YALNIZCA admin tarafından kurulur. AI otomatik seçim YOK.
// =============================================================

export const ALBUM_PAKETLER = [
  { deger: "baslangic", etiket: "Başlangıç", adet: 50 },
  { deger: "premium", etiket: "Premium", adet: 100 },
  { deger: "vip", etiket: "VIP", adet: 200 },
  { deger: "ozel", etiket: "Özel", adet: 0 }, // admin adedi belirler
] as const;

export type AlbumPaket = (typeof ALBUM_PAKETLER)[number]["deger"];

export const PAKET_DEGERLER: string[] = ALBUM_PAKETLER.map((p) => p.deger);

export function paketEtiket(deger: string | null | undefined): string {
  if (!deger) return "—";
  return ALBUM_PAKETLER.find((p) => p.deger === deger)?.etiket ?? deger;
}

// Pakete göre fotoğraf limiti (ozel için adminin verdiği adet, 1..500).
export function paketAdet(paket: string, ozelAdet?: number | null): number {
  if (paket === "ozel") {
    const n = Math.floor(ozelAdet ?? 0);
    return Math.max(1, Math.min(500, n || 50));
  }
  return ALBUM_PAKETLER.find((p) => p.deger === paket)?.adet ?? 50;
}

// Albüm bölümleri (düğün hikâye akışı). Admin her fotoğrafı bir bölüme atar.
export const BOLUM_DUZEN = [
  "Hazırlık",
  "Kına",
  "Nikah",
  "Düğün",
  "İlk Dans",
  "Pasta",
  "Takı",
  "Eğlence",
  "Kapanış",
  "Diğer",
];

export const VARSAYILAN_BOLUM = "Diğer";
