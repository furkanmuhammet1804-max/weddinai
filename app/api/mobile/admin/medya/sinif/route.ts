// POST /api/mobile/admin/medya/sinif — admin bir medyanın kategorisini değiştirir
// (override). kategori: "tekli" | "toplu" | "video" | null (temizle).
import { NextResponse } from "next/server";
import { adminBearerGecerli } from "@/lib/mobil/admin-token";
import { kategoriDegistir } from "@/lib/medya/veri";
import { KATEGORI_DEGERLER } from "@/lib/medya/sabit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!adminBearerGecerli(request)) {
    return NextResponse.json({ hata: "Yetki yok." }, { status: 401 });
  }

  let body: { mediaId?: string; kategori?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ hata: "Geçersiz istek." }, { status: 400 });
  }

  const mediaId = (body.mediaId ?? "").trim();
  const kategori = body.kategori ?? null;
  if (!mediaId) {
    return NextResponse.json({ hata: "İçerik kimliği gerekli." }, { status: 400 });
  }
  if (kategori !== null && !KATEGORI_DEGERLER.includes(kategori)) {
    return NextResponse.json({ hata: "Geçersiz kategori." }, { status: 400 });
  }

  const ok = await kategoriDegistir(mediaId, kategori);
  if (!ok) return NextResponse.json({ hata: "Güncellenemedi." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
