// =============================================================
// Davetiye teması — ortak tip. Her tema kendi dosyasında bu tipi
// uygular (registry deseni). Yeni tema eklemek = yeni bir dosya +
// index.ts'e tek satır. if/else yok.
// =============================================================

export type DavetiyeTemaId = string;

export interface DavetiyeTema {
  id: DavetiyeTemaId;
  ad: string;
  bg: string; // davetiye zemini (CSS background)
  yazi: string; // isimler / ana metin
  alt: string; // ikincil metin (eyebrow, tarih)
  vurgu: string; // & ve buton aksanı, çizgi/ayraç rengi
  butonYazi: string; // "Davetiyeyi Aç" buton metni
  koyu: boolean; // koyu zeminli mi (kart kontrastı için)
}
