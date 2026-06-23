// POST /api/mobile/album/kaydet — müşteri albüm seçimini kaydeder (kapak +
// fotoğraf listesi/bölüm/sıra). Bearer ile eventId doğrulanır; odanın seçim
// token'ı çözülüp limit + sahiplik kontrollü kaydedilir.
import { NextResponse } from "next/server";
import { bearerToken, mobilTokenCoz } from "@/lib/mobil/token";
import { albumHakDurum, albumSecimKaydet } from "@/lib/album/veri";

export async function POST(request: Request) {
  const oturum = mobilTokenCoz(bearerToken(request));
  if (!oturum) {
    return NextResponse.json({ hata: "Oturum geçersiz." }, { status: 401 });
  }

  let body: {
    kapakMediaId?: string | null;
    fotograflar?: { media_id: string; bolum: string | null; sira: number }[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ hata: "Geçersiz istek." }, { status: 400 });
  }

  const hak = await albumHakDurum(oturum.eventId);
  if (!hak || !hak.secim_token) {
    return NextResponse.json({ hata: "Bu oda için albüm hakkı yok." }, { status: 404 });
  }

  const sonuc = await albumSecimKaydet(hak.secim_token, {
    kapakMediaId: body.kapakMediaId ?? null,
    fotograflar: Array.isArray(body.fotograflar) ? body.fotograflar : [],
  });
  if (!sonuc.ok) {
    return NextResponse.json({ hata: sonuc.hata ?? "Kaydedilemedi." }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
