// =============================================================
// POST /api/ai/tebrik-oneri  —  AI Tebrik Mesajı Asistanı (Özellik 1)
//
// Public rota: misafirin "Anı Bırak" ekranındaki "✨ AI ile yardım al"
// modali çağırır. Seçilen tona göre 3 tebrik mesajı önerir.
//
// Güvenlik: Zod doğrulama + IP rate-limit + PII-siz loglama. AI'ya yalnızca
// ton + (opsiyonel) ilk adlar + kısa ipucu gider; telefon/e-posta GİTMEZ.
// =============================================================
import { NextResponse } from "next/server";
import { tebrikOneriSema } from "@/lib/ai/sema";
import { tebrikOneriPrompt } from "@/lib/ai/prompts";
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

  const ayris = tebrikOneriSema.safeParse(ham);
  if (!ayris.success) {
    return NextResponse.json(
      { ok: false, hata: "Lütfen bir ton seçin." },
      { status: 400 },
    );
  }
  const g = ayris.data;

  return oneriCalistir(request, {
    islemTip: "tebrik-oneri",
    prompt: tebrikOneriPrompt({
      ton: g.ton,
      cift_ad: g.cift_ad,
      iliski: g.iliski,
    }),
    maxTokens: 900,
    // PII-siz: yalnızca ton + ipucu olup olmadığı bilgisi.
    logOzet: { ton: g.ton, ipucu_var: !!g.iliski },
  });
}
