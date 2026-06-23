// GET /api/mobile/admin/album/pdf?id=&token= — albüm PDF'i (kapak + bölümler +
// foto + sayfa no). Tarayıcıda açıldığı için yetki ?token= ile de doğrulanır.
import { NextResponse } from "next/server";
import { adminBearerGecerli } from "@/lib/mobil/admin-token";
import { albumGetir } from "@/lib/album/veri";
import { albumPdf } from "@/lib/pdf/uret";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  if (!adminBearerGecerli(request)) {
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
