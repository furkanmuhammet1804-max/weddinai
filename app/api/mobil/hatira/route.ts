// GET /api/mobil/hatira — mobil uygulama için YAYINLANMIŞ hatıra defteri
// (salt-okunur). Bearer token doğrulanır; içerik sunucuda çözülür (AES-256).
// (Özellik 3 — mobil BFF ucu; gerçek mobil ekran ayrı repoda.)
import { NextResponse } from "next/server";
import { bearerToken, mobilTokenCoz } from "@/lib/mobil/token";
import { odaBilgiId, odaAcikMi } from "@/lib/oda/veri";
import { hatiraEventIcin } from "@/lib/hatira/veri";

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

  const defter = await hatiraEventIcin(oturum.eventId);
  // Yalnızca YAYINLANMIŞ defter mobilde gösterilir (taslak gizli).
  if (!defter || defter.durum !== "yayinda") {
    return NextResponse.json({ defter: null });
  }

  return NextResponse.json({
    defter: {
      baslik: defter.baslik,
      icerik: defter.icerik,
      yayinlandi: defter.published_at,
    },
  });
}
