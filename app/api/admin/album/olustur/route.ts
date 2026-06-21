// POST /api/admin/album/olustur — admin albümü oluşturur (Özellik 5).
// Otomatik DEĞİL; yalnız admin'in eylemiyle. AI seçimi YOKTUR: albüm,
// müşterinin işaretlediği adaylar + favorilerden tohumlanır, kürasyonu
// admin elle yapar (kapak/bölüm/sıra). YALNIZCA ADMIN.
import { NextResponse } from "next/server";
import { adminOturumGecerli } from "@/lib/admin/oturum";
import { albumOlusturSema } from "@/lib/album/sema";
import { albumOlustur } from "@/lib/album/veri";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await adminOturumGecerli())) {
    return NextResponse.json({ ok: false, hata: "Yetki yok." }, { status: 401 });
  }
  let ham: unknown;
  try {
    ham = await request.json();
  } catch {
    return NextResponse.json({ ok: false, hata: "Geçersiz istek." }, { status: 400 });
  }
  const ayris = albumOlusturSema.safeParse(ham);
  if (!ayris.success) {
    return NextResponse.json({ ok: false, hata: "Eksik/hatalı alan." }, { status: 400 });
  }
  const { eventId, paket, ozelAdet } = ayris.data;
  const sonuc = await albumOlustur(eventId, paket, ozelAdet ?? null);
  if (!sonuc.ok) {
    return NextResponse.json({ ok: false, hata: sonuc.hata ?? "Oluşturulamadı." }, { status: 400 });
  }
  return NextResponse.json({ ok: true, id: sonuc.id, mevcut: !!sonuc.mevcut });
}
