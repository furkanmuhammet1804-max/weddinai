// GET /api/album-sec/pdf?token=<token> — Müşteri albüm PDF'i (PUBLIC, token ile).
// Müşteri seçimini tamamlayınca PDF SİSTEM tarafından talep anında üretilir;
// admin müdahalesi GEREKMEZ. Token tahmin edilemez (32 char base64url).
import { NextResponse } from "next/server";
import { rateLimit, istemciIp } from "@/lib/mobil/rate-limit";
import { albumSecimAlbumGetir } from "@/lib/album/veri";
import { albumPdf } from "@/lib/pdf/uret";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  const ip = istemciIp(request);
  const lim = rateLimit(`album-sec-pdf:${ip}`, 10, 60_000);
  if (!lim.izin) {
    return NextResponse.json(
      { ok: false, hata: "Çok fazla istek." },
      { status: 429, headers: { "Retry-After": String(lim.kalanSn) } },
    );
  }

  const token = new URL(request.url).searchParams.get("token") ?? "";
  const album = await albumSecimAlbumGetir(token);
  if (!album) {
    return NextResponse.json({ ok: false, hata: "Albüm bulunamadı." }, { status: 404 });
  }
  if (album.fotograflar.length === 0) {
    return NextResponse.json(
      { ok: false, hata: "Albümde fotoğraf yok." },
      { status: 400 },
    );
  }

  const pdf = await albumPdf(album);

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="dugun-albumu.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
