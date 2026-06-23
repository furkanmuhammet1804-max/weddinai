// /api/mobile/showroom
//   GET  → odanın vitrindeki (onaylı) medyası + {onayli,bekleyen} istatistiği
//   POST → müşteri bir medyayı vitrine GÖNDERİR / geri çeker (admin onayı bekler)
// Bearer ile eventId doğrulanır; yalnızca kendi odası.
import { NextResponse } from "next/server";
import { bearerToken, mobilTokenCoz } from "@/lib/mobil/token";
import { odaBilgiId, odaAcikMi, odaMedyalari, showroomTalepDegistir } from "@/lib/oda/veri";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const oturum = mobilTokenCoz(bearerToken(request));
  if (!oturum) {
    return NextResponse.json({ hata: "Oturum geçersiz." }, { status: 401 });
  }

  const bilgi = await odaBilgiId(oturum.eventId);
  if (!odaAcikMi(bilgi)) {
    return NextResponse.json({ hata: "Oda erişime kapalı." }, { status: 403 });
  }

  const tum = await odaMedyalari(oturum.eventId);
  const vitrin = tum
    .filter((m) => m.showroom_approved && m.url)
    .map((m) => ({
      id: m.id,
      url: m.url,
      mediumUrl: m.mediumUrl,
      orijinalUrl: m.orijinalUrl,
      tur: m.file_type,
      yukleyen: m.guest_name,
      tarih: m.created_at,
    }));

  const onayli = tum.filter((m) => m.showroom_approved).length;
  const bekleyen = tum.filter((m) => m.showroom_requested && !m.showroom_approved).length;

  return NextResponse.json({ vitrin, istatistik: { onayli, bekleyen } });
}

export async function POST(request: Request) {
  const oturum = mobilTokenCoz(bearerToken(request));
  if (!oturum) {
    return NextResponse.json({ hata: "Oturum geçersiz." }, { status: 401 });
  }

  let body: { mediaId?: string; onay?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ hata: "Geçersiz istek." }, { status: 400 });
  }

  const mediaId = (body.mediaId ?? "").trim();
  if (!mediaId) {
    return NextResponse.json({ hata: "İçerik kimliği gerekli." }, { status: 400 });
  }

  const ok = await showroomTalepDegistir(oturum.eventId, mediaId, !!body.onay);
  if (!ok) return NextResponse.json({ hata: "Güncellenemedi." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
