// =============================================================
// POST /api/ai/davetiye-not  —  AI Davetiye Not Yardımcısı (Özellik 2)
//
// Public rota: davetiye talep formundaki "Notunuz için AI'dan yardım alın"
// modali çağırır. Kategoriye göre (çift hikâyesi / davetiye açıklaması /
// tasarım notu) 3 öneri üretir.
//
// Güvenlik: Zod doğrulama + IP rate-limit + PII-siz loglama. AI'ya yalnızca
// kategori + ilk adlar + kısa ipucu gider; telefon/e-posta GİTMEZ.
// =============================================================
import { NextResponse } from "next/server";
import { davetiyeNotSema } from "@/lib/ai/sema";
import { davetiyeNotPrompt } from "@/lib/ai/prompts";
import { oneriCalistir } from "@/lib/ai/oneri-calistir";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let ham: unknown;
  try {
    ham = await request.json();
  } catch {
    return NextResponse.json({ ok: false, hata: "Geçersiz istek." }, { status: 400 });
  }

  const ayris = davetiyeNotSema.safeParse(ham);
  if (!ayris.success) {
    return NextResponse.json(
      { ok: false, hata: "Lütfen bir kategori seçin." },
      { status: 400 },
    );
  }
  const g = ayris.data;

  return oneriCalistir(request, {
    islemTip: "davetiye-not",
    prompt: davetiyeNotPrompt({
      kategori: g.kategori,
      gelin_ad: g.gelin_ad,
      damat_ad: g.damat_ad,
      ipucu: g.ipucu,
    }),
    maxTokens: 1200,
    // PII-siz: kategori + ipucu olup olmadığı.
    logOzet: { kategori: g.kategori, ipucu_var: !!g.ipucu },
  });
}
