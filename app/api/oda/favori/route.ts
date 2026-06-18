// Müşteri bir içeriği favorilere ekler/çıkarır (kendi odasıyla sınırlı).
import { NextResponse } from "next/server";
import { odaOturumOku } from "@/lib/oda/oturum";
import { favoriDegistir } from "@/lib/oda/veri";

export async function POST(request: Request) {
  let body: { slug?: string; mediaId?: string; favori?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ hata: "Geçersiz istek." }, { status: 400 });
  }

  const slug = (body.slug ?? "").trim();
  const mediaId = (body.mediaId ?? "").trim();
  if (!slug || !mediaId) {
    return NextResponse.json({ hata: "Eksik parametre." }, { status: 400 });
  }

  const eventId = await odaOturumOku(slug);
  if (!eventId) {
    return NextResponse.json({ hata: "Oturum geçersiz." }, { status: 401 });
  }

  const ok = await favoriDegistir(eventId, mediaId, !!body.favori);
  if (!ok) {
    return NextResponse.json({ hata: "Güncelleme başarısız." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
