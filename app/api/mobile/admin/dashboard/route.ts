// GET /api/mobile/admin/dashboard — yönetim istatistikleri.
import { NextResponse } from "next/server";
import { adminBearerGecerli } from "@/lib/mobil/admin-token";
import { adminIstatistik } from "@/lib/oda/veri";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!adminBearerGecerli(request)) {
    return NextResponse.json({ hata: "Yetki yok." }, { status: 401 });
  }
  const istatistik = await adminIstatistik();
  return NextResponse.json({ istatistik });
}
