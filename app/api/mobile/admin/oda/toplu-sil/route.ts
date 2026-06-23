// POST /api/mobile/admin/oda/toplu-sil — birden çok odayı TAMAMEN siler.
import { NextResponse } from "next/server";
import { adminBearerGecerli } from "@/lib/mobil/admin-token";
import { odalariSil } from "@/lib/oda/veri";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  if (!adminBearerGecerli(request)) {
    return NextResponse.json({ hata: "Yetki yok." }, { status: 401 });
  }

  let body: { ids?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ hata: "Geçersiz istek." }, { status: 400 });
  }
  const ids = Array.isArray(body.ids)
    ? body.ids.filter((x): x is string => typeof x === "string")
    : [];
  if (ids.length === 0) {
    return NextResponse.json({ hata: "En az bir oda seçin." }, { status: 400 });
  }

  const sonuc = await odalariSil(ids);
  if (!sonuc.ok) {
    return NextResponse.json({ hata: sonuc.hata ?? "Silinemedi." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, silinen: sonuc.silinen });
}
