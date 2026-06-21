// POST /api/admin/medya/kucuk-backfill — eski fotoğraflar için thumb/medium üret.
// Parti parti çalışır; "kalan" döner → admin döngüyle devam eder. YALNIZCA ADMIN.
import { NextResponse } from "next/server";
import { adminOturumGecerli } from "@/lib/admin/oturum";
import { medyaAnalizSema } from "@/lib/medya/sema";
import { bekleyenKucukler, kucukUret, kucukDurum } from "@/lib/medya/veri";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Thumbnail üretimi yüz tespitinden daha hafif ama I/O ağırlıklı; küçük parti.
const PARTI = 12;

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
  const ayris = medyaAnalizSema.safeParse(ham);
  if (!ayris.success) {
    return NextResponse.json({ ok: false, hata: "Etkinlik kimliği gerekli." }, { status: 400 });
  }
  const { eventId } = ayris.data;

  const parti = await bekleyenKucukler(eventId, PARTI);
  let islenen = 0;
  for (const id of parti) {
    try {
      await kucukUret(id);
    } catch {
      /* tek medya hatası partiyi durdurmasın */
    }
    islenen++;
  }

  const durum = await kucukDurum(eventId);
  return NextResponse.json({
    ok: true,
    islenen,
    kalan: durum.bekleyen,
    hazir: durum.hazir,
    toplam: durum.toplam,
  });
}
