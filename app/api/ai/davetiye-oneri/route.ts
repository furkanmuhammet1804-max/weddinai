// =============================================================
// POST /api/ai/davetiye-oneri  —  AI Davetiye Asistanı (Faz 1)
//
// Public rota: çiftin sipariş ekranındaki "✨ AI ile Yardım Al" modali çağırır.
// Akış: IP rate-limit (Faz 0) → prompt → Anthropic (structured JSON) → log.
// Para harcayan public bir uç olduğundan IP başına hız limiti uygulanır.
// =============================================================
import { NextResponse } from "next/server";
import { metinUret } from "@/lib/ai/anthropic";
import { davetiyeOneriPrompt } from "@/lib/ai/prompts";
import { aiLogKaydet } from "@/lib/ai/logger";
import { rateLimitKontrol, istekIp } from "@/lib/ai/rate-limit";
import type { DavetiyeOneriGirdi } from "@/lib/ai/types";
import { TEMA_IDLER, type DavetiyeTemaId } from "@/lib/davetiye-tema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ISLEM = "davetiye-oneri" as const;
// IP başına 60 saniyede en fazla 6 öneri isteği.
const LIMIT = { limit: 6, pencereSn: 60 };

const kirp = (v: unknown, n: number) =>
  typeof v === "string" ? v.trim().slice(0, n) || null : null;

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
    .slice(0, 3);
}

export async function POST(request: Request) {
  const ip = istekIp(request);

  // 1) Hız limiti (Faz 0)
  const limit = await rateLimitKontrol(ip, ISLEM, LIMIT);
  if (!limit.izin) {
    return NextResponse.json(
      {
        ok: false,
        hata: "Çok fazla istek. Lütfen biraz sonra tekrar deneyin.",
      },
      { status: 429, headers: { "Retry-After": String(limit.yenidenSn ?? 60) } },
    );
  }

  // 2) Girdi
  let b: Record<string, unknown>;
  try {
    b = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, hata: "Geçersiz istek." },
      { status: 400 },
    );
  }

  const gelin_ad = kirp(b.gelin_ad, 80);
  const damat_ad = kirp(b.damat_ad, 80);
  if (!gelin_ad || !damat_ad) {
    return NextResponse.json(
      { ok: false, hata: "Öneri için gelin ve damat adı gerekli." },
      { status: 400 },
    );
  }
  const tema: DavetiyeTemaId = TEMA_IDLER.includes(b.tema as DavetiyeTemaId)
    ? (b.tema as DavetiyeTemaId)
    : "ivory";

  const girdi: DavetiyeOneriGirdi = {
    gelin_ad,
    damat_ad,
    tema,
    ton: kirp(b.ton, 40),
    tarih: kirp(b.tarih, 60),
    detay: kirp(b.detay, 500),
  };

  // 3) Üretim + loglama
  const baslangic = Date.now();
  try {
    const { system, user, jsonSema } = davetiyeOneriPrompt(girdi);
    const sonuc = await metinUret({ system, user, jsonSema, maxTokens: 1200 });
    const oneriler = onerileriAyikla(sonuc.metin);

    if (oneriler.length === 0) {
      await aiLogKaydet({
        islemTip: ISLEM,
        model: sonuc.model,
        basari: false,
        hata: "Boş/ayrıştırılamayan yanıt",
        girdiOzet: { gelin: gelin_ad, damat: damat_ad, tema },
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
      islemTip: ISLEM,
      model: sonuc.model,
      basari: true,
      girdiOzet: { gelin: gelin_ad, damat: damat_ad, tema, ton: girdi.ton },
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
      islemTip: ISLEM,
      model: "claude-opus-4-8",
      basari: false,
      hata: mesaj,
      girdiOzet: { gelin: gelin_ad, damat: damat_ad, tema },
      sureMs: Date.now() - baslangic,
      ip,
    });
    return NextResponse.json(
      { ok: false, hata: "AI servisi şu an yanıt veremedi. Tekrar deneyin." },
      { status: 500 },
    );
  }
}
