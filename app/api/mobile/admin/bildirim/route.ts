// POST /api/mobile/admin/bildirim — toplu (tüm odalar) veya oda bazlı push
// bildirimi gönderir (Expo push). Alıcı sayısını döndürür.
import { NextResponse } from "next/server";
import { adminBearerGecerli } from "@/lib/mobil/admin-token";
import { pushGonder } from "@/lib/push/veri";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!adminBearerGecerli(request)) {
    return NextResponse.json({ hata: "Yetki yok." }, { status: 401 });
  }

  let body: { kapsam?: string; baslik?: string; mesaj?: string; odaId?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ hata: "Geçersiz istek." }, { status: 400 });
  }

  const kapsam = body.kapsam === "oda" ? "oda" : "tum";
  const baslik = (body.baslik ?? "").trim();
  const mesaj = (body.mesaj ?? "").trim();
  const odaId = (body.odaId ?? "").trim() || null;

  if (baslik.length < 2 || mesaj.length < 2) {
    return NextResponse.json({ hata: "Başlık ve mesaj gerekli." }, { status: 400 });
  }
  if (kapsam === "oda" && !odaId) {
    return NextResponse.json({ hata: "Oda bazlı bildirim için oda seçin." }, { status: 400 });
  }

  const gonderilen = await pushGonder(kapsam === "oda" ? odaId : null, baslik, mesaj);
  return NextResponse.json({ ok: true, gonderilen });
}
