// =============================================================
// Davetiye temaları — müşterinin sipariş sırasında seçtiği görünüm.
// Yalnızca renk/atmosfer; istemci ve sunucu tarafından paylaşılır
// (server-only import içermez — client component'lerde güvenle kullanılır).
// =============================================================

export type DavetiyeTemaId = "ivory" | "gold" | "rose" | "midnight";

export interface DavetiyeTema {
  id: DavetiyeTemaId;
  ad: string;
  bg: string; // davetiye zemini (CSS background)
  yazi: string; // isimler / ana metin
  alt: string; // ikincil metin (eyebrow, tarih)
  vurgu: string; // & ve buton aksanı
  butonYazi: string; // "Davetiyeyi Aç" buton metni
  koyu: boolean; // koyu zeminli mi (kart kontrastı için)
}

export const DAVETIYE_TEMALAR: DavetiyeTema[] = [
  {
    id: "ivory",
    ad: "Fildişi",
    bg: "linear-gradient(180deg, #FFFDF9 0%, #F3EBDC 100%)",
    yazi: "#3A3327",
    alt: "#9A8A6D",
    vurgu: "#B08D3F",
    butonYazi: "#FFFFFF",
    koyu: false,
  },
  {
    id: "gold",
    ad: "Gold",
    bg: "linear-gradient(160deg, #2B2218 0%, #14100B 100%)",
    yazi: "#F4E8CC",
    alt: "#C7AD7E",
    vurgu: "#DCB87A",
    butonYazi: "#1A140C",
    koyu: true,
  },
  {
    id: "rose",
    ad: "Rose",
    bg: "linear-gradient(180deg, #FCF1F1 0%, #F2D8DD 100%)",
    yazi: "#5A2F38",
    alt: "#A9737D",
    vurgu: "#C77B86",
    butonYazi: "#FFFFFF",
    koyu: false,
  },
  {
    id: "midnight",
    ad: "Midnight",
    bg: "linear-gradient(165deg, #1C2542 0%, #0C1124 100%)",
    yazi: "#E9EDF8",
    alt: "#9AA6CC",
    vurgu: "#BAC7EF",
    butonYazi: "#141A2C",
    koyu: true,
  },
];

export const TEMA_IDLER: DavetiyeTemaId[] = DAVETIYE_TEMALAR.map((t) => t.id);

export function temaBul(id?: string | null): DavetiyeTema {
  return DAVETIYE_TEMALAR.find((t) => t.id === id) ?? DAVETIYE_TEMALAR[0];
}
