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
  // Yaratıcılık ayarları (doğallık/çeşitlilik için). Verilmezse sağlayıcı
  // varsayılanı kullanılır. Yaratıcı metinlerde yüksek (≈1.0-1.15) önerilir.
  temperature?: number;
  topP?: number;
  // Verilirse yanıt bu JSON şemasına uydurulur (structured output).
  // Şema, sağlayıcıdan bağımsız JSON-Schema alt kümesidir; her sağlayıcı
  // kendi biçimine çevirir.
  jsonSema?: Record<string, unknown>;
}

export interface UretimSonuc extends AiKullanim {
  metin: string;
  model: string;
}

// Görsel sınıflandırma (Özellik 4) — yalnızca KATEGORİ belirleme için.
// Güvenlik: çağıran taraf foto göndermeden önce KVKK onayını doğrular.
export interface GorselSiniflaSecenek {
  imageBase64: string;
  mimeType: string;
  kategoriler: string[]; // izin verilen kategori değerleri
  model?: string;
}

export interface GorselSiniflaSonuc extends AiKullanim {
  kategori: string | null; // listedeki bir değer veya null
  model: string;
}

export interface AiSaglayici {
  ad: string; // "gemini" vb.
  varsayilanModel: string;
  metinUret(opts: UretimSecenek): Promise<UretimSonuc>;
  // Opsiyonel: her sağlayıcı görsel desteklemeyebilir.
  gorselSinifla?(opts: GorselSiniflaSecenek): Promise<GorselSiniflaSonuc>;
}
