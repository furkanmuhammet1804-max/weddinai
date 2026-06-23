// /api/mobile/admin/medya
//   GET  → tüm odalardaki showroom onay kuyruğu (müşteri gönderdi, admin onayı yok)
//   POST {mediaId,onay} → vitrine onayla (true) / reddet (false)
import { NextResponse } from "next/server";
import { adminBearerGecerli } from "@/lib/mobil/admin-token";
import { onayKuyrugu, adminOnayDegistir } from "@/lib/oda/veri";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!adminBearerGecerli(request)) {
    return NextResponse.json({ hata: "Yetki yok." }, { status: 401 });
  }
  const ham = await onayKuyrugu();
  const kuyruk = ham.map((m) => ({
    id: m.id,
    url: m.url,
    tur: m.file_type,
    yukleyen: m.guest_name,
    oda_id: m.event_id,
    oda_title: m.event_title,
    kod: m.slug,
    tarih: m.created_at,
  }));
  return NextResponse.json({ kuyruk });
}

export async function POST(request: Request) {
  if (!adminBearerGecerli(request)) {
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
  if (!ok) return NextResponse.json({ hata: "Güncellenemedi." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
