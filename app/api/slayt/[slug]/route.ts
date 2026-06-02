// Canlı slayt akışı — düğün ekranı bunu periyodik çağırır (yeni fotoğraflar).
import { NextResponse } from "next/server";
import { slaytVerisi } from "@/lib/oda/veri";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  const temiz = typeof slug === "string" ? slug.trim() : "";
  if (!temiz) {
    return NextResponse.json({ hata: "Eksik slug." }, { status: 400 });
  }
  const veri = await slaytVerisi(temiz);
  if (!veri) {
    return NextResponse.json({ hata: "Bulunamadı." }, { status: 404 });
  }
  return NextResponse.json({
    baslik: veri.bilgi.title,
    fotograflar: veri.fotograflar,
  });
}
