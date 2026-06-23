// POST /api/mobile/admin/davetiye/sil — bir davetiyeyi TAMAMEN siler
// (depolama + RSVP + DB kaydı).
import { NextResponse } from "next/server";
import { adminBearerGecerli } from "@/lib/mobil/admin-token";
import { davetiyeSil } from "@/lib/davetiye";

export const dynamic = "force-dynamic";

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
    return NextResponse.json({ hata: "Davetiye kimliği gerekli." }, { status: 400 });
  }

  const ok = await davetiyeSil(id);
  if (!ok) {
    return NextResponse.json({ hata: "Davetiye silinemedi." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
