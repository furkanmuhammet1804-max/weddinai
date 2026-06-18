// İletişim / sipariş kanalı. Başlangıçta online ödeme yok; sipariş WhatsApp
// üzerinden alınır. Numara env'den gelir (NEXT_PUBLIC_WHATSAPP_NUMBER, sadece
// rakam, ülke koduyla; örn. 905551112233). Numara tanımlı değilse sipariş
// formuna (/siparis) düşülür ki site her durumda çalışsın.

export const WHATSAPP_NUMARA = (
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ""
).replace(/[^\d]/g, "");

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
