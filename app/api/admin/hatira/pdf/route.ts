// GET /api/admin/hatira/pdf?id=<defterId> — Hatıra Defteri PDF'i (F3).
// Sunucuda pdfkit ile üretilir, indirilebilir döner. YALNIZCA ADMIN (§7).
import { NextResponse } from "next/server";
import { adminOturumGecerli } from "@/lib/admin/oturum";
import { hatiraGetirId } from "@/lib/hatira/veri";
import { odaAnilari } from "@/lib/oda/veri";
import { hatiraPdf } from "@/lib/pdf/uret";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await adminOturumGecerli())) {
    return NextResponse.json({ hata: "Yetki yok." }, { status: 401 });
  }
  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!id) return NextResponse.json({ hata: "id gerekli." }, { status: 400 });

  const defter = await hatiraGetirId(id);
  if (!defter) return NextResponse.json({ hata: "Bulunamadı." }, { status: 404 });

  const anilar = await odaAnilari(defter.event_id);
  const mesajlar = anilar
    .filter((a) => (a.message_text ?? "").trim().length > 0)
    .map((a) => ({ ad: a.guest_name, mesaj: a.message_text as string }));

  const pdf = await hatiraPdf({
    baslik: defter.baslik,
    ciftBaslik: defter.event_title,
    tarih: defter.published_at,
    icerik: defter.icerik,
    mesajlar,
  });

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="hatira-defteri.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
