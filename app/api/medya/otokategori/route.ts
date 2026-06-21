// =============================================================
// POST /api/medya/otokategori — misafir yüklemesi sonrası TEK medyayı
// otomatik kategorile (Özellik 4 revizyonu). PUBLIC ama doğrulanır:
//   - slug aktif bir etkinliğe ait olmalı
//   - mediaId o etkinliğe ait olmalı
// Yüz tespiti tamamen sunucuda lokaldir (pico.js); hiçbir veri dışarı çıkmaz.
// Fotoğraf yalnızca KVKK onayı (events.ai_medya_onay) varsa işlenir.
//
// Misafir akışında "ateşle-unut" çağrılır; sonuç UI'ı bloklamaz.
// =============================================================
import { NextResponse } from "next/server";
import { rateLimit, istemciIp } from "@/lib/mobil/rate-limit";
import { otoKategoriSema } from "@/lib/medya/sema";
import { medyaSlugDogrula, otoKategoriUygula } from "@/lib/medya/veri";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const ip = istemciIp(request);
  // Yükleme başına bir çağrı beklenir; dakikada 60 makul bir tavan.
  const lim = rateLimit(`otokategori:${ip}`, 60, 60_000);
  if (!lim.izin) {
    return NextResponse.json({ ok: false, hata: "Çok fazla istek." }, {
      status: 429,
      headers: { "Retry-After": String(lim.kalanSn) },
    });
  }

  let ham: unknown;
  try {
    ham = await request.json();
  } catch {
    return NextResponse.json({ ok: false, hata: "Geçersiz istek." }, { status: 400 });
  }
  const ayris = otoKategoriSema.safeParse(ham);
  if (!ayris.success) {
    return NextResponse.json({ ok: false, hata: "Eksik/hatalı alan." }, { status: 400 });
  }
  const { slug, mediaId } = ayris.data;

  // Yetki: medya gerçekten bu slug'lı aktif etkinliğe mi ait?
  if (!(await medyaSlugDogrula(slug, mediaId))) {
    return NextResponse.json({ ok: false, hata: "Bulunamadı." }, { status: 404 });
  }

  try {
    const sonuc = await otoKategoriUygula(mediaId);
    return NextResponse.json({ ok: sonuc.ok, kategori: sonuc.kategori, beklemede: !!sonuc.beklemede });
  } catch {
    return NextResponse.json({ ok: false, hata: "İşlenemedi." }, { status: 500 });
  }
}
