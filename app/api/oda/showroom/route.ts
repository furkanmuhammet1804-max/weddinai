// Müşteri bir fotoğrafı showroom'da yayınlar / geri çeker.
// Yalnızca geçerli oda oturumu olan müşteri, KENDİ odasının medyasını
// değiştirebilir (oturum çerezi slug'a bağlı imzalı).
import { NextResponse } from "next/server";
import { odaOturumOku } from "@/lib/oda/oturum";
import { showroomOnayDegistir } from "@/lib/oda/veri";

export async function POST(request: Request) {
  let body: { slug?: string; mediaId?: string; onay?: boolean };
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

  const ok = await showroomOnayDegistir(eventId, mediaId, !!body.onay);
  if (!ok) {
    return NextResponse.json(
      { hata: "Güncelleme başarısız." },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}
