// İletişim / sipariş kanalı. Başlangıçta online ödeme yok; sipariş WhatsApp
// üzerinden alınır. Numara env'den gelebilir (NEXT_PUBLIC_WHATSAPP_NUMBER,
// sadece rakam, ülke koduyla; örn. 905551112233). Env yoksa kanonik marka
// numarasına düşülür — böylece numara her yerde tutarlıdır.

// Kanonik marka numarası: +90 531 913 59 61
const VARSAYILAN_NUMARA = "905319135961";

export const WHATSAPP_NUMARA = (
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || VARSAYILAN_NUMARA
).replace(/[^\d]/g, "");

// İnsan-okur biçim (footer / iletişim metinleri için).
export const TELEFON_GORUNEN = "+90 531 913 59 61";

// Instagram marka hesabı.
export const INSTAGRAM_KULLANICI = "weddinai";
export function instagramLinki(): string {
  return `https://instagram.com/${INSTAGRAM_KULLANICI}`;
}

export function siparisLinki(paketSlug?: string, paketAd?: string): string {
  if (!WHATSAPP_NUMARA) {
    return paketSlug ? `/siparis?paket=${paketSlug}` : "/siparis";
  }
  const mesaj = paketAd
    ? `Merhaba, WeddinAI ${paketAd} paketi için bilgi almak istiyorum.`
    : "Merhaba, WeddinAI hakkında bilgi almak istiyorum.";
  return `https://wa.me/${WHATSAPP_NUMARA}?text=${encodeURIComponent(mesaj)}`;
}

export function bayiLinki(): string {
  if (!WHATSAPP_NUMARA) return "/siparis";
  return `https://wa.me/${WHATSAPP_NUMARA}?text=${encodeURIComponent(
    "Merhaba, WeddinAI bayilik/ortaklık hakkında bilgi almak istiyorum.",
  )}`;
}

export const WHATSAPP_VAR = !!WHATSAPP_NUMARA;
