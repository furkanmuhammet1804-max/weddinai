// =============================================================
// AI altyapısı — paylaşılan tipler (Faz 0).
// Sunucu-only import içermez; gerekirse client'ta da kullanılabilir.
// =============================================================

// Yeni asistanlar eklendikçe burası büyür. (ai_islem_log.islem_tip = text,
// migration gerektirmez.)
export type AiIslemTip =
  | "davetiye-oneri"
  | "tebrik-oneri"
  | "davetiye-not"
  | "hatira-defteri"
  | "medya-kategori";

// AI yanıtındaki token kullanımı (sağlayıcıdan bağımsız sadeleştirilmiş hal).
export interface AiKullanim {
  inputToken: number;
  outputToken: number;
}

// ai_islem_log tablosundaki bir satır (admin geçmiş ekranı için).
export interface AiIslemLog {
  id: string;
  islem_tip: string;
  model: string;
  basari: boolean;
  hata: string | null;
  girdi_ozet: Record<string, unknown> | null;
  cikti_ozet: Record<string, unknown> | null;
  input_token: number;
  output_token: number;
  maliyet_usd: number;
  sure_ms: number | null;
  ip: string | null;
  created_at: string;
}

// ---- Davetiye öneri asistanı (Faz 1) ----

export interface DavetiyeOneriGirdi {
  gelin_ad: string;
  damat_ad: string;
  tema?: string | null;
  ton?: string | null; // "klasik" | "modern" | "samimi" | "zarif" ...
  tarih?: string | null; // serbest metin (ör. "12 Temmuz 2026")
  detay?: string | null; // çiftin eklemek istediği serbest not
}

export interface DavetiyeOneriYanit {
  ok: boolean;
  oneriler?: string[];
  hata?: string;
}

// ---- Tebrik mesajı asistanı (Özellik 1) ----
// Misafir, çifte tebrik/dilek yazarken yardım alır. Güvenlik: AI'ya yalnızca
// ton + (opsiyonel) ilk adlar + kısa ipucu gider; telefon/e-posta ASLA gitmez.

export type TebrikTon = "Kısa" | "Samimi" | "Duygusal" | "Resmi" | "Komik";

export interface TebrikOneriGirdi {
  ton: TebrikTon;
  cift_ad?: string | null; // ör. "Bengisu & Furkan" (yalnızca ilk adlar)
  iliski?: string | null; // ör. "arkadaşı", "kuzeni" (serbest, kısa)
}

// ---- Davetiye not yardımcısı (Özellik 2) ----
// Çift; davetiye açıklaması, çift hikâyesi veya özel/tasarım notu için öneri ister.

export type DavetiyeNotKategori = "hikaye" | "aciklama" | "tasarim";

export interface DavetiyeNotGirdi {
  kategori: DavetiyeNotKategori;
  gelin_ad?: string | null; // yalnızca ilk ad
  damat_ad?: string | null; // yalnızca ilk ad
  ipucu?: string | null; // çiftin verdiği kısa serbest ipucu
}

// Tüm "öneri listesi" dönen AI uçları için ortak yanıt biçimi.
export interface OneriYanit {
  ok: boolean;
  oneriler?: string[];
  hata?: string;
}
