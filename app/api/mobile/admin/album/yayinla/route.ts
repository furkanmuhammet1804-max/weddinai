// POST /api/mobile/admin/album/yayinla — albümü yayınlar/taslağa alır.
import { NextResponse } from "next/server";
import { adminBearerGecerli } from "@/lib/mobil/admin-token";
import { albumYayinla } from "@/lib/album/veri";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!adminBearerGecerli(request)) {
    return NextResponse.json({ hata: "Yetki yok." }, { status: 401 });
  }

  let body: { id?: string; yayinla?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ hata: "Geçersiz istek." }, { status: 400 });
  }

  const id = (body.id ?? "").trim();
  if (!id) {
    return NextResponse.json({ hata: "Albüm kimliği gerekli." }, { status: 400 });
  }

  const sonuc = await albumYayinla(id, !!body.yayinla);
  if (!sonuc.ok) {
    return NextResponse.json({ hata: "Güncellenemedi." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, slug: sonuc.slug ?? null });
}
