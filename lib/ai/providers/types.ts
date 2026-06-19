// =============================================================
// AI sağlayıcı (provider) arayüzü (Faz 0).
// Sağlayıcıdan bağımsız sözleşme: her sağlayıcı metinUret() sunar.
// Böylece Gemini / başka bir model arasında geçiş tek noktadan yapılır.
// =============================================================
import type { AiKullanim } from "@/lib/ai/types";

export interface UretimSecenek {
  system: string;
  user: string;
  model?: string;
  maxTokens?: number;
  // Verilirse yanıt bu JSON şemasına uydurulur (structured output).
  // Şema, sağlayıcıdan bağımsız JSON-Schema alt kümesidir; her sağlayıcı
  // kendi biçimine çevirir.
  jsonSema?: Record<string, unknown>;
}

export interface UretimSonuc extends AiKullanim {
  metin: string;
  model: string;
}

export interface AiSaglayici {
  ad: string; // "gemini" vb.
  varsayilanModel: string;
  metinUret(opts: UretimSecenek): Promise<UretimSonuc>;
}
