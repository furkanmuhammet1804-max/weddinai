// POST /api/mobile/admin/album/teslim — albümü "teslim edildi" işaretler/geri alır.
import { NextResponse } from "next/server";
import { adminBearerGecerli } from "@/lib/mobil/admin-token";
import { albumTeslimEt } from "@/lib/album/veri";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!adminBearerGecerli(request)) {
    return NextResponse.json({ hata: "Yetki yok." }, { status: 401 });
  }

  let body: { albumId?: string; teslim?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ hata: "Geçersiz istek." }, { status: 400 });
  }

  const albumId = (body.albumId ?? "").trim();
  if (!albumId) {
    return NextResponse.json({ hata: "Albüm kimliği gerekli." }, { status: 400 });
  }

  const sonuc = await albumTeslimEt(albumId, !!body.teslim);
  if (!sonuc.ok) {
    return NextResponse.json({ hata: sonuc.hata ?? "İşlem başarısız." }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
