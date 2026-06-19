// =============================================================
// AI işlem loglama (Faz 0) — YALNIZCA SUNUCU TARAFI (service-role).
// Her AI çağrısı (başarılı/başarısız) ai_islem_log'a yazılır.
// Loglama hiçbir zaman asıl isteği bozmamalı → tüm hatalar yutulur.
// =============================================================
import { createAdminClient } from "@/lib/supabase/admin";
import { maliyetHesapla } from "@/lib/ai/cost";
import type { AiIslemLog, AiIslemTip } from "@/lib/ai/types";

export interface AiLogGirdi {
  islemTip: AiIslemTip;
  model: string;
  basari: boolean;
  hata?: string | null;
  girdiOzet?: Record<string, unknown> | null;
  ciktiOzet?: Record<string, unknown> | null;
  inputToken?: number;
  outputToken?: number;
  sureMs?: number | null;
  ip?: string | null;
}

// Tek bir AI işlemini kaydeder. Maliyet token'lardan otomatik hesaplanır.
export async function aiLogKaydet(g: AiLogGirdi): Promise<void> {
  try {
    const inputToken = g.inputToken ?? 0;
    const outputToken = g.outputToken ?? 0;
    const admin = createAdminClient();
    const { error } = await admin.from("ai_islem_log").insert({
      islem_tip: g.islemTip,
      model: g.model,
      basari: g.basari,
      hata: g.hata ?? null,
      girdi_ozet: g.girdiOzet ?? null,
      cikti_ozet: g.ciktiOzet ?? null,
      input_token: inputToken,
      output_token: outputToken,
      maliyet_usd: maliyetHesapla(g.model, inputToken, outputToken),
      sure_ms: g.sureMs ?? null,
      ip: g.ip ?? null,
    });
    if (error) console.error("[ai] log kayıt hatası", error.message);
  } catch (e) {
    console.error("[ai] log kayıt istisnası", e);
  }
}

// Admin geçmiş ekranı: en yeni işlemler.
export async function aiLogListe(limit = 100): Promise<AiIslemLog[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("ai_islem_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as AiIslemLog[];
}

export interface AiLogOzet {
  toplam: number;
  basarili: number;
  hatali: number;
  toplamMaliyet: number;
  toplamToken: number;
}

// Geçmiş ekranı başlık kartları için özet istatistik.
export async function aiLogOzet(): Promise<AiLogOzet> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("ai_islem_log")
    .select("basari, input_token, output_token, maliyet_usd");
  const satirlar = (data ?? []) as Pick<
    AiIslemLog,
    "basari" | "input_token" | "output_token" | "maliyet_usd"
  >[];
  return satirlar.reduce<AiLogOzet>(
    (acc, s) => {
      acc.toplam += 1;
      if (s.basari) acc.basarili += 1;
      else acc.hatali += 1;
      acc.toplamMaliyet += Number(s.maliyet_usd) || 0;
      acc.toplamToken += (s.input_token || 0) + (s.output_token || 0);
      return acc;
    },
    { toplam: 0, basarili: 0, hatali: 0, toplamMaliyet: 0, toplamToken: 0 },
  );
}
