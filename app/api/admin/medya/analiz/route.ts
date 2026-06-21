// =============================================================
// POST /api/admin/medya/analiz — bekleyen medyaları LOKAL kategorile (Özellik 4).
// YALNIZCA ADMIN. Yüz tespiti tamamen sunucuda (pico.js) — hiçbir yere gönderilmez.
// Büyük odalarda parti parti çalışır; "kalan" döner → admin "Devam et" der.
// Gemini Vision YOK (sürekli maliyet kaldırıldı).
// =============================================================
import { NextResponse } from "next/server";
import { adminOturumGecerli } from "@/lib/admin/oturum";
import { medyaAnalizSema } from "@/lib/medya/sema";
import { KATEGORI_PARTI_BOYUT } from "@/lib/medya/sabit";
import { bekleyenMedyalar, otoKategoriUygula, kategoriDurum } from "@/lib/medya/veri";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

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

  const parti = await bekleyenMedyalar(eventId, KATEGORI_PARTI_BOYUT);
  let islenen = 0;
  for (const m of parti) {
    try {
      await otoKategoriUygula(m.id);
    } catch {
      /* tek medya hatası tüm partiyi durdurmasın */
    }
    islenen++;
  }

  const durum = await kategoriDurum(eventId);
  return NextResponse.json({
    ok: true,
    islenen,
    kalan: durum.bekleyen,
    kategorilenen: durum.kategorilenen,
    toplam: durum.toplam,
    ai_medya_onay: durum.ai_medya_onay,
  });
}
