// POST /api/mobile/album/tamamla — müşteri seçimi tamamlar (readonly kilidi).
// Bearer ile eventId doğrulanır; odanın seçim token'ı çözülüp tamamlanır.
import { NextResponse } from "next/server";
import { bearerToken, mobilTokenCoz } from "@/lib/mobil/token";
import { albumHakDurum, albumSecimTamamla } from "@/lib/album/veri";

export async function POST(request: Request) {
  const oturum = mobilTokenCoz(bearerToken(request));
  if (!oturum) {
    return NextResponse.json({ hata: "Oturum geçersiz." }, { status: 401 });
  }

  const hak = await albumHakDurum(oturum.eventId);
  if (!hak || !hak.secim_token) {
    return NextResponse.json({ hata: "Bu oda için albüm hakkı yok." }, { status: 404 });
  }

  const sonuc = await albumSecimTamamla(hak.secim_token);
  if (!sonuc.ok) {
    return NextResponse.json({ hata: sonuc.hata ?? "Tamamlanamadı." }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
