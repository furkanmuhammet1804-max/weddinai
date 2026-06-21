// Müşteri bir fotoğrafı "albüme aday" işaretler/kaldırır (kendi odasıyla sınırlı).
// Albümü yalnızca admin kurar; bu yalnızca adminin gördüğü bir öneridir.
import { NextResponse } from "next/server";
import { odaOturumOku } from "@/lib/oda/oturum";
import { albumAdayDegistir } from "@/lib/oda/veri";

export async function POST(request: Request) {
  let body: { slug?: string; mediaId?: string; aday?: boolean };
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

  const ok = await albumAdayDegistir(eventId, mediaId, !!body.aday);
  if (!ok) {
    return NextResponse.json({ hata: "Güncelleme başarısız." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
