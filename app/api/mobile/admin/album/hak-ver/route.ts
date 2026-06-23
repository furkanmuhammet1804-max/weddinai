// POST /api/mobile/admin/album/hak-ver — bir odaya albüm hakkı verir (paket +
// foto limiti, seçim token'ı). Müşteri seçim ekranı aktif olur.
import { NextResponse } from "next/server";
import { adminBearerGecerli } from "@/lib/mobil/admin-token";
import { albumHakkiVer } from "@/lib/album/veri";

export const dynamic = "force-dynamic";

const GECERLI_PAKET = new Set(["baslangic", "premium", "vip", "ozel"]);

export async function POST(request: Request) {
  if (!adminBearerGecerli(request)) {
    return NextResponse.json({ hata: "Yetki yok." }, { status: 401 });
  }

  let body: { eventId?: string; paket?: string; ozelAdet?: number | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ hata: "Geçersiz istek." }, { status: 400 });
  }

  const eventId = (body.eventId ?? "").trim();
  const paket = body.paket ?? "";
  if (!eventId || !GECERLI_PAKET.has(paket)) {
    return NextResponse.json({ hata: "Eksik/hatalı alan." }, { status: 400 });
  }

  const sonuc = await albumHakkiVer(eventId, paket, body.ozelAdet ?? null);
  if (!sonuc.ok) {
    return NextResponse.json({ hata: sonuc.hata ?? "İşlem başarısız." }, { status: 400 });
  }
  return NextResponse.json({ ok: true, token: sonuc.token });
}
