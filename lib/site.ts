// Kanonik üretim alanı (canonical origin).
//
// Misafirlere paylaşılan tüm linkler/QR'lar DAİMA bu alan üzerinden üretilmeli.
// Admin/müşteri paneli bazen apex (weddinai.com) veya bir Vercel önizleme
// adresinden açılabiliyor; bu durumda `window.location.origin` yanlış alanı
// gömer ve misafir tarayıcısında "bağlantı güvenli değil" uyarısı çıkar
// (SSL sertifikası yalnızca www alanını kapsadığı için). Bu yüzden paylaşım
// linklerinde origin yerine her zaman bu sabiti kullanın.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.weddinai.com"
).replace(/\/+$/, "");

// Kanonik alanla mutlak bir paylaşım linki üretir.
// `siteLinki("/e/abc")` -> "https://www.weddinai.com/e/abc"
export function siteLinki(yol: string): string {
  return `${SITE_URL}/${yol.replace(/^\/+/, "")}`;
}
