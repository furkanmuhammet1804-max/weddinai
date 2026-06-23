// /api/mobile/admin/kvkk
//   GET  ?eventId= → KVKK AI onay durumu + müşteri onay linki (/ai-onay/<token>)
//   POST {eventId,onay} → onayı elle aç/kapat
import { NextResponse } from "next/server";
import { adminBearerGecerli } from "@/lib/mobil/admin-token";
import { createAdminClient } from "@/lib/supabase/admin";
import { onayTokenGetirVeyaUret } from "@/lib/kvkk/onay";
import { etkinlikOnayBelirle } from "@/lib/medya/veri";
import { siteLinki } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!adminBearerGecerli(request)) {
    return NextResponse.json({ hata: "Yetki yok." }, { status: 401 });
  }

  const eventId = (new URL(request.url).searchParams.get("eventId") ?? "").trim();
  if (!eventId) {
    return NextResponse.json({ hata: "Oda kimliği gerekli." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("events")
    .select("title, ai_medya_onay, ai_medya_onay_at")
    .eq("id", eventId)
    .maybeSingle();
  if (!data) {
    return NextResponse.json({ hata: "Oda bulunamadı." }, { status: 404 });
  }

  const token = await onayTokenGetirVeyaUret(eventId).catch(() => null);

  return NextResponse.json({
    eventId,
    baslik: (data.title as string) ?? "",
    ai_medya_onay: !!data.ai_medya_onay,
    ai_medya_onay_at: (data.ai_medya_onay_at as string) ?? null,
    onayLink: token ? siteLinki(`/ai-onay/${token}`) : null,
  });
}

export async function POST(request: Request) {
  if (!adminBearerGecerli(request)) {
    return NextResponse.json({ hata: "Yetki yok." }, { status: 401 });
  }

  let body: { eventId?: string; onay?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ hata: "Geçersiz istek." }, { status: 400 });
  }

  const eventId = (body.eventId ?? "").trim();
  if (!eventId) {
    return NextResponse.json({ hata: "Oda kimliği gerekli." }, { status: 400 });
  }

  const ok = await etkinlikOnayBelirle(eventId, !!body.onay);
  if (!ok) return NextResponse.json({ hata: "Güncellenemedi." }, { status: 500 });
  return NextResponse.json({ ok: true, onay: !!body.onay });
}
