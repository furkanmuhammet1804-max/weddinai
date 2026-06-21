// GET /api/mobil/album — mobil uygulama için YAYINLANMIŞ albüm (salt-okunur).
// Bearer token doğrulanır; fotoğraflar imzalı URL ile döner.
// (Özellik 5 — mobil BFF ucu; gerçek mobil ekran ayrı repoda.)
import { NextResponse } from "next/server";
import { bearerToken, mobilTokenCoz } from "@/lib/mobil/token";
import { odaBilgiId, odaAcikMi } from "@/lib/oda/veri";
import { albumEventYayinda } from "@/lib/album/veri";

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

  const album = await albumEventYayinda(oturum.eventId);
  if (!album) {
    return NextResponse.json({ album: null });
  }

  return NextResponse.json({
    album: {
      baslik: album.baslik,
      kapak_media_id: album.kapak_media_id,
      yayinlandi: album.published_at,
      fotograflar: album.fotograflar.map((f) => ({
        id: f.media_id,
        url: f.url,
        bolum: f.bolum,
        sira: f.sira,
      })),
    },
  });
}
