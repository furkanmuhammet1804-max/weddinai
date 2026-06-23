// GET /api/mobile/album/pdf — müşteri kendi tamamladığı albümün PDF'ini indirir.
// Bearer (Authorization) veya ?token= (tarayıcı/indirme katmanı) ile eventId
// doğrulanır; odanın seçim token'ı çözülüp PDF talep anında üretilir.
import { NextResponse } from "next/server";
import { bearerToken, mobilTokenCoz } from "@/lib/mobil/token";
import { albumHakDurum, albumSecimAlbumGetir } from "@/lib/album/veri";
import { albumPdf } from "@/lib/pdf/uret";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function tokenAl(request: Request): string | null {
  const b = bearerToken(request);
  if (b) return b;
  try {
    return new URL(request.url).searchParams.get("token");
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const oturum = mobilTokenCoz(tokenAl(request));
  if (!oturum) {
    return NextResponse.json({ hata: "Oturum geçersiz." }, { status: 401 });
  }

  const hak = await albumHakDurum(oturum.eventId);
  if (!hak || !hak.secim_token) {
    return NextResponse.json({ hata: "Albüm bulunamadı." }, { status: 404 });
  }

  const album = await albumSecimAlbumGetir(hak.secim_token);
  if (!album) {
    return NextResponse.json({ hata: "Albüm bulunamadı." }, { status: 404 });
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
