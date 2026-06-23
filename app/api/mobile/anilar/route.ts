// GET /api/mobile/anilar — odanın sesli anıları (hatıra/guestbook). Bearer
// doğrulanır; ses dosyaları imzalı URL ile döner.
import { NextResponse } from "next/server";
import { bearerToken, mobilTokenCoz } from "@/lib/mobil/token";
import { odaBilgiId, odaAcikMi, odaAnilari } from "@/lib/oda/veri";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const oturum = mobilTokenCoz(bearerToken(request));
  if (!oturum) {
    return NextResponse.json({ hata: "Oturum geçersiz." }, { status: 401 });
  }

  const bilgi = await odaBilgiId(oturum.eventId);
  if (!odaAcikMi(bilgi)) {
    return NextResponse.json({ hata: "Oda erişime kapalı." }, { status: 403 });
  }

  const tum = await odaAnilari(oturum.eventId);
  const anilar = tum.map((a) => ({
    id: a.id,
    guest_name: a.guest_name,
    message_text: a.message_text,
    audio_url: a.audio_url,
    tarih: a.created_at,
  }));

  return NextResponse.json({ anilar });
}
