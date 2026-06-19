// =============================================================
// AI altyapısı — paylaşılan tipler (Faz 0).
// Sunucu-only import içermez; gerekirse client'ta da kullanılabilir.
// =============================================================

// Şu an tek AI işlemi var; yeni asistanlar eklendikçe burası büyür.
export type AiIslemTip = "davetiye-oneri";

// Anthropic mesaj yanıtındaki token kullanımı (bizim sadeleştirilmiş halimiz).
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
