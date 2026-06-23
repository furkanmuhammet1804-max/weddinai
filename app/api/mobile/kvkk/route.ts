// /api/mobile/kvkk
//   GET  → odanın KVKK/AI medya işleme onay durumu
//   POST → müşteri onay verir (ai_medya_onay=true); onay öncesi kategorisiz
//          fotoğraflar yeniden kuyruğa alınır.
// Bearer ile eventId doğrulanır (müşteri yalnız kendi odası için onaylar).
import { NextResponse } from "next/server";
import { bearerToken, mobilTokenCoz } from "@/lib/mobil/token";
import { createAdminClient } from "@/lib/supabase/admin";
import { etkinlikOnayBelirle } from "@/lib/medya/veri";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const oturum = mobilTokenCoz(bearerToken(request));
  if (!oturum) {
    return NextResponse.json({ hata: "Oturum geçersiz." }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("events")
    .select("title, customer_name, ai_medya_onay, ai_medya_onay_at")
    .eq("id", oturum.eventId)
    .maybeSingle();

  if (!data) {
    return NextResponse.json({ hata: "Oda bulunamadı." }, { status: 404 });
  }

  return NextResponse.json({
    onayli: !!data.ai_medya_onay,
    onay_tarihi: (data.ai_medya_onay_at as string) ?? null,
    oda: {
      title: (data.title as string) ?? "",
      customer_name: (data.customer_name as string) ?? null,
    },
  });
}

export async function POST(request: Request) {
  const oturum = mobilTokenCoz(bearerToken(request));
  if (!oturum) {
    return NextResponse.json({ hata: "Oturum geçersiz." }, { status: 401 });
  }

  // etkinlikOnayBelirle ai_medya_onay_at'i yazar ve onay sonrası kategorisiz
  // fotoğrafları yeniden kuyruğa alır (içeride onaySonrasiKuyrugaAl çağrılır).
  const ok = await etkinlikOnayBelirle(oturum.eventId, true);
  if (!ok) return NextResponse.json({ hata: "Onay kaydedilemedi." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
