// POST /api/medya/kucuk-uret — misafir yüklemesi sonrası TEK foto için thumb+
// medium üretir (sharp). PUBLIC ama doğrulanır (slug aktif + media o odaya ait).
// Ateşle-unut çağrılır; UI'ı bloklamaz.
import { NextResponse } from "next/server";
import { rateLimit, istemciIp } from "@/lib/mobil/rate-limit";
import { otoKategoriSema } from "@/lib/medya/sema";
import { medyaSlugDogrula, kucukUret } from "@/lib/medya/veri";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const ip = istemciIp(request);
  const lim = rateLimit(`kucuk-uret:${ip}`, 80, 60_000);
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
  if (!(await medyaSlugDogrula(slug, mediaId))) {
    return NextResponse.json({ ok: false, hata: "Bulunamadı." }, { status: 404 });
  }
  try {
    const sonuc = await kucukUret(mediaId);
    return NextResponse.json({ ok: sonuc.ok });
  } catch {
    return NextResponse.json({ ok: false, hata: "Üretilemedi." }, { status: 500 });
  }
}
