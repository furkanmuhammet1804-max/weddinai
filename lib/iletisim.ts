// İletişim / sipariş kanalı. Başlangıçta online ödeme yok; sipariş WhatsApp
// üzerinden alınır. Tüm müşterilerin ulaşacağı tek marka numarası burada
// SABİTTİR — env override'ı bilinçli olarak kaldırıldı ki Vercel'de yanlış bir
// NEXT_PUBLIC_WHATSAPP_NUMBER ayarlı olsa bile site daima bu numarayı kullansın.

// Kanonik marka numarası: +90 531 913 59 61
export const WHATSAPP_NUMARA = "905319135961";

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
