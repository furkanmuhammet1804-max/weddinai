// Mobil medya listesi: bearer token doğrulanır → odanın TÜM medyası
// (imzalı URL'lerle, web müşteri paneliyle aynı service-role okuması)
// + galeri üst bilgisi ve istatistik döner. Reddedilen içerik gizlenir.
import { NextResponse } from "next/server";
import { bearerToken, mobilTokenCoz } from "@/lib/mobil/token";
import { odaBilgiId, odaAcikMi, odaMedyalari } from "@/lib/oda/veri";

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
  const medya = tum
    .filter((m) => m.url && m.status !== "reddedildi")
    .map((m) => ({
      id: m.id,
      url: m.url,
      tur: m.file_type, // "fotograf" | "video"
      yukleyen: m.guest_name,
      tarih: m.created_at,
    }));

  const foto = medya.filter((m) => m.tur === "fotograf").length;
  const video = medya.filter((m) => m.tur === "video").length;
  const sonYukleme = medya.reduce<string | null>(
    (en, m) => (en === null || m.tarih > en ? m.tarih : en),
    null,
  );

  return NextResponse.json({
    oda: {
      id: bilgi!.id,
      kod: bilgi!.slug,
      title: bilgi!.title,
      event_type: bilgi!.event_type,
      event_date: bilgi!.event_date,
    },
    istatistik: { foto, video, toplam: medya.length, son_yukleme: sonYukleme },
    medya,
  });
}
