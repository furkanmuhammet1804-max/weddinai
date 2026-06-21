// =============================================================
// AI Medya Merkezi — paylaşılan sabitler (Özellik 4). Sunucu-only import yok;
// hem rota/sınıflandırıcı hem de admin UI kullanır.
// =============================================================

export const MEDYA_KATEGORILER = [
  { deger: "gelin_damat", etiket: "Gelin & Damat" },
  { deger: "aile", etiket: "Aile" },
  { deger: "arkadas", etiket: "Arkadaş" },
  { deger: "grup", etiket: "Grup" },
  { deger: "sahne", etiket: "Sahne" },
  { deger: "nikah", etiket: "Nikah" },
  { deger: "kina", etiket: "Kına" },
  { deger: "dugun", etiket: "Düğün" },
] as const;

export type MedyaKategori = (typeof MEDYA_KATEGORILER)[number]["deger"];

export const KATEGORI_DEGERLER: string[] = MEDYA_KATEGORILER.map((k) => k.deger);

export function kategoriEtiket(deger: string | null | undefined): string {
  if (!deger) return "—";
  return MEDYA_KATEGORILER.find((k) => k.deger === deger)?.etiket ?? deger;
}

// Tek seferde işlenecek en fazla fotoğraf (büyük odalarda "Devam et" ile devam).
export const ANALIZ_PARTI_BOYUT = 40;
