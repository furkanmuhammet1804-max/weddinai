// GET /api/admin/album/pdf?id=<albumId> — Albüm PDF'i (F5).
// Sunucuda pdfkit ile üretilir (kapak + bölümler + foto + sayfa no), indirilir.
// YALNIZCA ADMIN (§7).
import { NextResponse } from "next/server";
import { adminOturumGecerli } from "@/lib/admin/oturum";
import { albumGetir } from "@/lib/album/veri";
import { albumPdf } from "@/lib/pdf/uret";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  if (!(await adminOturumGecerli())) {
    return NextResponse.json({ hata: "Yetki yok." }, { status: 401 });
  }
  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!id) return NextResponse.json({ hata: "id gerekli." }, { status: 400 });

  const album = await albumGetir(id);
  if (!album) return NextResponse.json({ hata: "Bulunamadı." }, { status: 404 });

  const pdf = await albumPdf(album);

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="dugun-albumu.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
