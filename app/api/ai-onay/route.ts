// =============================================================
// POST /api/ai-onay — müşteri KVKK AI medya işleme onayını verir (PUBLIC).
// Body: { token }. Token odaya özeldir; IP kanıt olarak saklanır.
// Sadece ilgili etkinlikte ai_medya_onay=true olur (idempotent).
// =============================================================
import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, istemciIp } from "@/lib/mobil/rate-limit";
import { onayVer } from "@/lib/kvkk/onay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const sema = z.object({ token: z.string().trim().min(16).max(128) });

export async function POST(request: Request) {
  const ip = istemciIp(request);
  const lim = rateLimit(`ai-onay:${ip}`, 20, 60_000);
  if (!lim.izin) {
    return NextResponse.json({ ok: false, hata: "Çok fazla istek." }, {
      status: 429,
      headers: { "Retry-After": String(lim.kalanSn) },
    });
  }

  let ham: unknown;
  try {
    ham = await request.json();
  } catch {
    return NextResponse.json({ ok: false, hata: "Geçersiz istek." }, { status: 400 });
  }
  const ayris = sema.safeParse(ham);
  if (!ayris.success) {
    return NextResponse.json({ ok: false, hata: "Geçersiz onay bağlantısı." }, { status: 400 });
  }

  const ok = await onayVer(ayris.data.token, ip);
  if (!ok) {
    return NextResponse.json({ ok: false, hata: "Onay kaydedilemedi." }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
