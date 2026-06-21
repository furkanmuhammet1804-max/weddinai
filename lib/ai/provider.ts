// =============================================================
// AI sağlayıcı seçici (Faz 0).
// AI_PROVIDER env değişkenine göre aktif sağlayıcıyı seçer.
// Varsayılan: gemini (Gemini 2.5 Flash).
//
// Tüm AI çağrıları bu modül üzerinden geçer; rota/asistanlar sağlayıcıyı
// doğrudan bilmez. Yeni sağlayıcı eklemek: providers/<ad>.ts + buraya case.
// =============================================================
import { geminiSaglayici } from "@/lib/ai/providers/gemini";
import type {
  AiSaglayici,
  UretimSecenek,
  UretimSonuc,
  GorselSiniflaSecenek,
  GorselSiniflaSonuc,
} from "@/lib/ai/providers/types";

export type { UretimSecenek, UretimSonuc, GorselSiniflaSecenek, GorselSiniflaSonuc };

export type AiProviderAd = "gemini";

function saglayiciSec(): AiSaglayici {
  const ad = (process.env.AI_PROVIDER ?? "gemini").toLowerCase();
  switch (ad) {
    case "gemini":
      return geminiSaglayici;
    default:
      // Bilinmeyen değer → güvenli varsayılan.
      return geminiSaglayici;
  }
}

export const aktifSaglayici: AiSaglayici = saglayiciSec();

// Aktif sağlayıcının varsayılan modeli (loglama/teşhis için).
export const VARSAYILAN_MODEL = aktifSaglayici.varsayilanModel;

// Tek seferlik metin üretimi — aktif sağlayıcıya devreder.
export function metinUret(opts: UretimSecenek): Promise<UretimSonuc> {
  return aktifSaglayici.metinUret(opts);
}

// Görsel sınıflandırma — aktif sağlayıcı destekliyorsa devreder.
export function gorselSinifla(
  opts: GorselSiniflaSecenek,
): Promise<GorselSiniflaSonuc> {
  if (!aktifSaglayici.gorselSinifla) {
    throw new Error(
      `${aktifSaglayici.ad} görsel sınıflandırmayı desteklemiyor.`,
    );
  }
  return aktifSaglayici.gorselSinifla(opts);
}
