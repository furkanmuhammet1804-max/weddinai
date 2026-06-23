// GET /api/mobile/admin/album — oda bazlı dijital albüm listesi (hak/durum/sayılar).
import { NextResponse } from "next/server";
import { adminBearerGecerli } from "@/lib/mobil/admin-token";
import { albumListe } from "@/lib/album/veri";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!adminBearerGecerli(request)) {
    return NextResponse.json({ hata: "Yetki yok." }, { status: 401 });
  }
  const liste = await albumListe();
  return NextResponse.json({ liste });
}
