// POST /api/admin/medya/onay-link — admin bir etkinlik için KVKK AI onay
// linkini (token) üretir/getirir. YALNIZCA ADMIN. Link: /ai-onay/<token>
import { NextResponse } from "next/server";
import { z } from "zod";
import { adminOturumGecerli } from "@/lib/admin/oturum";
import { onayTokenGetirVeyaUret } from "@/lib/kvkk/onay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const sema = z.object({ eventId: z.string().uuid() });

export async function POST(request: Request) {
  if (!(await adminOturumGecerli())) {
    return NextResponse.json({ ok: false, hata: "Yetki yok." }, { status: 401 });
  }
  let ham: unknown;
  try {
    ham = await request.json();
  } catch {
    return NextResponse.json({ ok: false, hata: "Geçersiz istek." }, { status: 400 });
  }
  const ayris = sema.safeParse(ham);
  if (!ayris.success) {
    return NextResponse.json({ ok: false, hata: "Etkinlik kimliği gerekli." }, { status: 400 });
  }
  const token = await onayTokenGetirVeyaUret(ayris.data.eventId);
  if (!token) {
    return NextResponse.json({ ok: false, hata: "Link üretilemedi." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, token });
}
