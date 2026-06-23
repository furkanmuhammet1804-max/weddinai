// GET /api/mobile/album/durum — müşteri dijital albüm seçim ekranı verisi.
// Bearer ile eventId doğrulanır → odanın albüm hakkı + seçim havuzu/durumu.
// Hak yoksa { hak: null, secim: null }.
import { NextResponse } from "next/server";
import { bearerToken, mobilTokenCoz } from "@/lib/mobil/token";
import { albumHakDurum, albumSecimGetir } from "@/lib/album/veri";
import { BOLUM_DUZEN, VARSAYILAN_BOLUM } from "@/lib/album/sabit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const oturum = mobilTokenCoz(bearerToken(request));
  if (!oturum) {
    return NextResponse.json({ hata: "Oturum geçersiz." }, { status: 401 });
  }

  const hak = await albumHakDurum(oturum.eventId);
  if (!hak) {
    return NextResponse.json({ hak: null, secim: null });
  }

  const secimVeri = hak.secim_token ? await albumSecimGetir(hak.secim_token) : null;

  return NextResponse.json({
    hak: {
      album_id: hak.album_id,
      paket: hak.paket,
      limit_adet: hak.limit_adet,
      tamamlandi: hak.secim_tamamlandi,
      secili_sayisi: hak.secili_sayisi,
    },
    bolumler: BOLUM_DUZEN,
    varsayilan_bolum: VARSAYILAN_BOLUM,
    secim: secimVeri
      ? {
          baslik: secimVeri.baslik,
          paket: secimVeri.paket,
          limit: secimVeri.limit_adet,
          limit_adet: secimVeri.limit_adet,
          kapak_media_id: secimVeri.kapak_media_id,
          tamamlandi: secimVeri.tamamlandi,
          tamamlandi_at: secimVeri.tamamlandi_at,
          secili: secimVeri.secili,
          havuz: secimVeri.havuz,
        }
      : null,
  });
}
