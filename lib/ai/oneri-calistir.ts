// =============================================================
// Ortak "öneri üret" çalıştırıcısı — {"oneriler": [...]} dönen AI uçları için.
// YALNIZCA SUNUCU TARAFI. Akış (Güvenlik Politikası §4):
//   IP rate-limit → AI üretimi → güvenli ayıklama → PII-siz loglama.
//
// logOzet'e ASLA ham mesaj/isim/iletişim bilgisi koyma; yalnızca türev,
// kişisel-olmayan alanlar (ton, kategori, adet) geçir.
// =============================================================
import { NextResponse } from "next/server";
import { metinUret, VARSAYILAN_MODEL } from "@/lib/ai/provider";
import { aiLogKaydet } from "@/lib/ai/logger";
import { rateLimitKontrol, istekIp } from "@/lib/ai/rate-limit";
import type { AiIslemTip } from "@/lib/ai/types";
import type { PromptCikti } from "@/lib/ai/prompts";

const VARSAYILAN_LIMIT = { limit: 6, pencereSn: 60 };

// Modelin döndürdüğü metni güvenli öneri listesine çevirir (en fazla 3).
function onerileriAyikla(ham: string): string[] {
  let veri: unknown;
  try {
    veri = JSON.parse(ham);
  } catch {
    return [];
  }
  const liste = (veri as { oneriler?: unknown })?.oneriler;
  if (!Array.isArray(liste)) return [];
  return liste
    .filter((x): x is string => typeof x === "string")
    .map((x) => x.trim())
    .filter(Boolean)
    .map((x) => x.slice(0, 1000)) // aşırı uzun çıktıyı sınırla
    .slice(0, 3);
}

export interface OneriCalistirSecenek {
  islemTip: AiIslemTip;
  prompt: PromptCikti;
  maxTokens?: number;
  // Yaratıcılık (doğallık/çeşitlilik). Verilmezse yaratıcı varsayılan kullanılır.
  temperature?: number;
  topP?: number;
  // PII-siz log özeti (ad/mesaj/iletişim İÇERMEZ).
  logOzet?: Record<string, unknown>;
  limit?: { limit: number; pencereSn: number };
}

// Yaratıcı metin uçları için varsayılan yaratıcılık (klişeyi kırar, çeşitlendirir).
const VARSAYILAN_TEMP = 1.05;
const VARSAYILAN_TOPP = 0.97;

export async function oneriCalistir(
  request: Request,
  opt: OneriCalistirSecenek,
): Promise<NextResponse> {
  const ip = istekIp(request);
  const limit = opt.limit ?? VARSAYILAN_LIMIT;

  // 1) Hız limiti
  const lim = await rateLimitKontrol(ip, opt.islemTip, limit);
  if (!lim.izin) {
    return NextResponse.json(
      { ok: false, hata: "Çok fazla istek. Lütfen biraz sonra tekrar deneyin." },
      { status: 429, headers: { "Retry-After": String(lim.yenidenSn ?? 60) } },
    );
  }

  // 2) Üretim + loglama
  const baslangic = Date.now();
  try {
    const sonuc = await metinUret({
      system: opt.prompt.system,
      user: opt.prompt.user,
      jsonSema: opt.prompt.jsonSema,
      maxTokens: opt.maxTokens ?? 1200,
      temperature: opt.temperature ?? VARSAYILAN_TEMP,
      topP: opt.topP ?? VARSAYILAN_TOPP,
    });
    const oneriler = onerileriAyikla(sonuc.metin);

    if (oneriler.length === 0) {
      await aiLogKaydet({
        islemTip: opt.islemTip,
        model: sonuc.model,
        basari: false,
        hata: "Boş/ayrıştırılamayan yanıt",
        girdiOzet: opt.logOzet ?? null,
        inputToken: sonuc.inputToken,
        outputToken: sonuc.outputToken,
        sureMs: Date.now() - baslangic,
        ip,
      });
      return NextResponse.json(
        { ok: false, hata: "Öneri üretilemedi. Tekrar deneyin." },
        { status: 502 },
      );
    }

    await aiLogKaydet({
      islemTip: opt.islemTip,
      model: sonuc.model,
      basari: true,
      girdiOzet: opt.logOzet ?? null,
      ciktiOzet: { adet: oneriler.length },
      inputToken: sonuc.inputToken,
      outputToken: sonuc.outputToken,
      sureMs: Date.now() - baslangic,
      ip,
    });
    return NextResponse.json({ ok: true, oneriler });
  } catch (err) {
    const mesaj = err instanceof Error ? err.message : "Bilinmeyen hata";
    await aiLogKaydet({
      islemTip: opt.islemTip,
      model: VARSAYILAN_MODEL,
      basari: false,
      hata: mesaj,
      girdiOzet: opt.logOzet ?? null,
      sureMs: Date.now() - baslangic,
      ip,
    });
    return NextResponse.json(
      { ok: false, hata: "AI servisi şu an yanıt veremedi. Tekrar deneyin." },
      { status: 500 },
    );
  }
}
