// POST /api/album-sec/tamamla — müşteri seçimini tamamlar (PUBLIC, token ile).
// Sonrasında seçim readonly olur; değişiklik yapılamaz.
import { NextResponse } from "next/server";
import { rateLimit, istemciIp } from "@/lib/mobil/rate-limit";
import { albumSecimTamamlaSema } from "@/lib/album/sema";
import { albumSecimTamamla } from "@/lib/album/veri";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ip = istemciIp(request);
  const lim = rateLimit(`album-sec-tamamla:${ip}`, 20, 60_000);
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
  const ayris = albumSecimTamamlaSema.safeParse(ham);
  if (!ayris.success) {
    return NextResponse.json({ ok: false, hata: "Geçersiz bağlantı." }, { status: 400 });
  }
  const sonuc = await albumSecimTamamla(ayris.data.token);
  if (!sonuc.ok) {
    return NextResponse.json({ ok: false, hata: sonuc.hata ?? "Tamamlanamadı." }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
