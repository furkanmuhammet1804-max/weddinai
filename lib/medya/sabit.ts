// =============================================================
// AI Medya Merkezi — paylaşılan sabitler (Özellik 4 revizyonu).
// Sunucu-only import yok; hem rota/işleyici hem admin UI kullanır.
//
// Kategoriler artık BASİT ve LOKAL (yüz sayımı / dosya türü):
//   tekli = 0–1 yüz · toplu = 2+ yüz · video = video dosyası
// Gemini Vision kategorileri KALDIRILDI (sürekli maliyet + karmaşık AI yok).
// =============================================================

export const MEDYA_KATEGORILER = [
  { deger: "tekli", etiket: "Tekli Fotoğraflar" },
  { deger: "toplu", etiket: "Toplu Fotoğraflar" },
  { deger: "video", etiket: "Videolar" },
] as const;

export type MedyaKategori = (typeof MEDYA_KATEGORILER)[number]["deger"];

export const KATEGORI_DEGERLER: string[] = MEDYA_KATEGORILER.map((k) => k.deger);

export function kategoriEtiket(deger: string | null | undefined): string {
  if (!deger) return "Kategorisiz";
  return MEDYA_KATEGORILER.find((k) => k.deger === deger)?.etiket ?? deger;
}

// Tek admin partisinde işlenecek en fazla bekleyen foto ("Devam et" ile sürer).
export const KATEGORI_PARTI_BOYUT = 25;
