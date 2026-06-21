// POST /api/admin/medya/yeniden-tara — kategorisiz kalmış tüm medyayı yeniden
// kuyruğa al (eski odalar için). Sonra admin "Bekleyenleri Kategorile" akışı
// (/api/admin/medya/analiz) bunları işler. YALNIZCA ADMIN.
import { NextResponse } from "next/server";
import { adminOturumGecerli } from "@/lib/admin/oturum";
import { medyaAnalizSema } from "@/lib/medya/sema";
import { yenidenTaraKuyrukla, kategoriDurum } from "@/lib/medya/veri";

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
  const ayris = medyaAnalizSema.safeParse(ham);
  if (!ayris.success) {
    return NextResponse.json({ ok: false, hata: "Etkinlik kimliği gerekli." }, { status: 400 });
  }
  const { eventId } = ayris.data;
  const kuyruga = await yenidenTaraKuyrukla(eventId);
  const durum = await kategoriDurum(eventId);
  return NextResponse.json({
    ok: true,
    kuyruga,
    kalan: durum.bekleyen,
    kategorilenen: durum.kategorilenen,
    toplam: durum.toplam,
    ai_medya_onay: durum.ai_medya_onay,
  });
}
