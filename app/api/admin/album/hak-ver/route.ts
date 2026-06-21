// POST /api/admin/album/hak-ver — admin bir odaya albüm hakkı verir (F5 V2).
// Paket + foto limiti kaydedilir, tahmin edilemez müşteri seçim token'ı üretilir.
// Müşteri linki: /album-sec/<token>. YALNIZCA ADMIN.
import { NextResponse } from "next/server";
import { adminOturumGecerli } from "@/lib/admin/oturum";
import { albumOlusturSema } from "@/lib/album/sema";
import { albumHakkiVer } from "@/lib/album/veri";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await adminOturumGecerli())) {
    return NextResponse.json({ ok: false, hata: "Yetki yok." }, { status: 401 });
  }
  let ham: unknown;
  try {
    ham = await request.json();
  } catch {
    return NextResponse.json({ ok: false, hata: "Geçersiz istek." }, { status: 400 });
  }
  const ayris = albumOlusturSema.safeParse(ham);
  if (!ayris.success) {
    return NextResponse.json({ ok: false, hata: "Eksik/hatalı alan." }, { status: 400 });
  }
  const { eventId, paket, ozelAdet } = ayris.data;
  const sonuc = await albumHakkiVer(eventId, paket, ozelAdet ?? null);
  if (!sonuc.ok) {
    return NextResponse.json({ ok: false, hata: sonuc.hata ?? "İşlem başarısız." }, { status: 400 });
  }
  return NextResponse.json({ ok: true, token: sonuc.token });
}
