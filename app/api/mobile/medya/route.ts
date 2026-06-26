// GET /api/mobile/medya — müşteri galerisi. Bearer doğrulanır → odanın TÜM
// medyası (thumb/medium/original imzalı URL + favori/album_aday) + istatistik.
// Reddedilen içerik gizlenir. (web müşteri paneliyle aynı service-role okuması)
import { NextResponse } from "next/server";
import { bearerToken, mobilTokenCoz } from "@/lib/mobil/token";
import {
  odaBilgiId,
  odaAcikMi,
  odaMedyalariSayfa,
  odaMedyaSayim,
} from "@/lib/oda/veri";

export const dynamic = "force-dynamic";

const VARSAYILAN_LIMIT = 50;
const MAX_LIMIT = 100;

// GET /api/mobile/medya?offset=0&limit=50 — sayfalı galeri (infinite scroll).
// İlk sayfada (offset=0) istatistik de döner; sonraki sayfalarda dönmez (ucuz).
// `sonraki`: bir sonraki offset veya null (son sayfa).
export async function GET(request: Request) {
  const oturum = mobilTokenCoz(bearerToken(request));
  if (!oturum) {
    return NextResponse.json({ hata: "Oturum geçersiz." }, { status: 401 });
  }

  const bilgi = await odaBilgiId(oturum.eventId);
  if (!odaAcikMi(bilgi)) {
    return NextResponse.json({ hata: "Oda erişime kapalı." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(
    Math.max(Number(searchParams.get("limit")) || VARSAYILAN_LIMIT, 1),
    MAX_LIMIT,
  );
  const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);

  // Galeri çipleri için sunucu tarafı filtre (tür + favori). İstatistik her zaman
  // GENEL sayımdır (filtreden bağımsız), yalnız ilk sayfada döner.
  const turParam = searchParams.get("tur");
  const tur =
    turParam === "fotograf" || turParam === "video" ? turParam : undefined;
  const favori = searchParams.get("favori") === "1";

  const [sayfa, istatistik] = await Promise.all([
    odaMedyalariSayfa(oturum.eventId, offset, limit, { tur, favori }),
    offset === 0 ? odaMedyaSayim(oturum.eventId) : Promise.resolve(null),
  ]);

  const medya = sayfa
    .filter((m) => m.url)
    .map((m) => ({
      id: m.id,
      url: m.url,
      mediumUrl: m.mediumUrl,
      orijinalUrl: m.orijinalUrl,
      tur: m.file_type,
      yukleyen: m.guest_name,
      favori: m.is_favorite,
      album_aday: m.album_aday,
      tarih: m.created_at,
    }));

  // Tam sayfa geldiyse muhtemelen devamı var; eksikse son sayfa.
  const sonraki = sayfa.length === limit ? offset + limit : null;

  return NextResponse.json({
    oda: {
      id: bilgi!.id,
      kod: bilgi!.slug,
      title: bilgi!.title,
      event_type: bilgi!.event_type,
      event_date: bilgi!.event_date,
    },
    istatistik,
    medya,
    sonraki,
  });
}
