// POST /api/album-sec/kaydet — müşteri albüm seçimini kaydeder (PUBLIC, token ile).
// Token odaya özeldir; yalnız o odanın fotoğrafları seçilebilir, limit aşılamaz.
import { NextResponse } from "next/server";
import { rateLimit, istemciIp } from "@/lib/mobil/rate-limit";
import { albumSecimKaydetSema } from "@/lib/album/sema";
import { albumSecimKaydet } from "@/lib/album/veri";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ip = istemciIp(request);
  const lim = rateLimit(`album-sec-kaydet:${ip}`, 60, 60_000);
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
  const ayris = albumSecimKaydetSema.safeParse(ham);
  if (!ayris.success) {
    return NextResponse.json({ ok: false, hata: "Eksik/hatalı alan." }, { status: 400 });
  }
  const { token, kapakMediaId, fotograflar } = ayris.data;
  const sonuc = await albumSecimKaydet(token, { kapakMediaId, fotograflar });
  if (!sonuc.ok) {
    return NextResponse.json({ ok: false, hata: sonuc.hata ?? "Kaydedilemedi." }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
