// POST /api/admin/medya/onay — KVKK: etkinlik için AI foto analizine onay
// ver/kaldır (§6). YALNIZCA ADMIN. Onay olmadan foto Gemini Vision'a gitmez.
import { NextResponse } from "next/server";
import { adminOturumGecerli } from "@/lib/admin/oturum";
import { medyaOnaySema } from "@/lib/medya/sema";
import { etkinlikOnayBelirle } from "@/lib/medya/veri";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  const ayris = medyaOnaySema.safeParse(ham);
  if (!ayris.success) {
    return NextResponse.json({ ok: false, hata: "Eksik/hatalı alan." }, { status: 400 });
  }
  const { eventId, onay } = ayris.data;
  const ok = await etkinlikOnayBelirle(eventId, onay);
  if (!ok) return NextResponse.json({ ok: false, hata: "Güncellenemedi." }, { status: 500 });
  return NextResponse.json({ ok: true, onay });
}
