// =============================================================
// AI Dijital Albüm — paylaşılan sabitler (Özellik 5). Sunucu-only import yok.
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

// F4 kategorisi → albüm bölümü (hikâye akışı).
export const KATEGORI_BOLUM: Record<string, string> = {
  kina: "Kına",
  nikah: "Nikah",
  dugun: "Düğün",
  sahne: "Sahne",
  gelin_damat: "Çift",
  aile: "Aile",
  arkadas: "Arkadaşlar",
  grup: "Grup",
};

// Hikâye akışı sıralaması (albümde bölüm sırası).
export const BOLUM_DUZEN = [
  "Kına",
  "Nikah",
  "Düğün",
  "Sahne",
  "Çift",
  "Aile",
  "Arkadaşlar",
  "Grup",
  "Diğer",
];

export function bolumIcin(kategori: string | null | undefined): string {
  return KATEGORI_BOLUM[kategori ?? ""] ?? "Diğer";
}
