// Yönetici showroom onay kuyruğunu yönetir: onay (true) / red (false).
import { NextResponse } from "next/server";
import { adminOturumGecerli } from "@/lib/admin/oturum";
import { adminOnayDegistir } from "@/lib/oda/veri";

export async function POST(request: Request) {
  if (!(await adminOturumGecerli())) {
    return NextResponse.json({ hata: "Yetki yok." }, { status: 401 });
  }

  let body: { mediaId?: string; onay?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ hata: "Geçersiz istek." }, { status: 400 });
  }

  const mediaId = (body.mediaId ?? "").trim();
  if (!mediaId) {
    return NextResponse.json({ hata: "İçerik kimliği gerekli." }, { status: 400 });
  }

  const ok = await adminOnayDegistir(mediaId, !!body.onay);
  if (!ok) {
    return NextResponse.json({ hata: "Güncellenemedi." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
