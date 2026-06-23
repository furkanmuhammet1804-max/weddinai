// POST /api/mobile/admin/oda/sil — bir odayı TAMAMEN siler (depolama + DB cascade).
import { NextResponse } from "next/server";
import { adminBearerGecerli } from "@/lib/mobil/admin-token";
import { odalariSil } from "@/lib/oda/veri";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  if (!adminBearerGecerli(request)) {
    return NextResponse.json({ hata: "Yetki yok." }, { status: 401 });
  }

  let body: { id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ hata: "Geçersiz istek." }, { status: 400 });
  }
  const id = (body.id ?? "").trim();
  if (!id) {
    return NextResponse.json({ hata: "Oda kimliği gerekli." }, { status: 400 });
  }

  const sonuc = await odalariSil([id]);
  if (!sonuc.ok) {
    return NextResponse.json({ hata: sonuc.hata ?? "Oda silinemedi." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
