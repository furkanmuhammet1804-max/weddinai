// POST /api/mobile/album-aday — müşteri bir fotoğrafı "albüme aday" işaretler/
// kaldırır (kendi odası). Albümü yine YALNIZCA admin kurar; bu bir öneridir.
import { NextResponse } from "next/server";
import { bearerToken, mobilTokenCoz } from "@/lib/mobil/token";
import { albumAdayDegistir } from "@/lib/oda/veri";

export async function POST(request: Request) {
  const oturum = mobilTokenCoz(bearerToken(request));
  if (!oturum) {
    return NextResponse.json({ hata: "Oturum geçersiz." }, { status: 401 });
  }

  let body: { mediaId?: string; aday?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ hata: "Geçersiz istek." }, { status: 400 });
  }

  const mediaId = (body.mediaId ?? "").trim();
  if (!mediaId) {
    return NextResponse.json({ hata: "İçerik kimliği gerekli." }, { status: 400 });
  }

  const ok = await albumAdayDegistir(oturum.eventId, mediaId, !!body.aday);
  if (!ok) return NextResponse.json({ hata: "Güncellenemedi." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
