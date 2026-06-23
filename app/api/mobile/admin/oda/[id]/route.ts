// GET /api/mobile/admin/oda/[id] — oda detayı: bilgi + istatistik + medya
// (kategori/showroom durumlarıyla) + sesli anılar.
import { NextResponse } from "next/server";
import { adminBearerGecerli } from "@/lib/mobil/admin-token";
import { createAdminClient } from "@/lib/supabase/admin";
import { odaMedyalari, odaAnilari, kalanGun } from "@/lib/oda/veri";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!adminBearerGecerli(request)) {
    return NextResponse.json({ hata: "Yetki yok." }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ hata: "Oda kimliği gerekli." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: ev } = await admin
    .from("events")
    .select("id, slug, title, customer_name, event_type, event_date, status, expires_at, ai_medya_onay")
    .eq("id", id)
    .maybeSingle();
  if (!ev) {
    return NextResponse.json({ hata: "Oda bulunamadı." }, { status: 404 });
  }

  const [medya, anilar] = await Promise.all([odaMedyalari(id), odaAnilari(id)]);

  const foto = medya.filter((m) => m.file_type === "fotograf").length;
  const video = medya.filter((m) => m.file_type === "video").length;
  const bekleyen = medya.filter((m) => m.showroom_requested && !m.showroom_approved).length;

  return NextResponse.json({
    oda: {
      id: ev.id,
      kod: ev.slug,
      slug: ev.slug,
      title: ev.title,
      customer_name: (ev.customer_name as string) ?? null,
      event_type: ev.event_type,
      event_date: (ev.event_date as string) ?? null,
      status: ev.status,
      expires_at: (ev.expires_at as string) ?? null,
      kalan_gun: kalanGun(ev.expires_at as string | null),
      ai_medya_onay: !!ev.ai_medya_onay,
    },
    istatistik: {
      foto,
      video,
      toplam: medya.length,
      ani: anilar.length,
      bekleyen,
    },
    medya: medya.map((m) => ({
      id: m.id,
      url: m.url,
      mediumUrl: m.mediumUrl,
      orijinalUrl: m.orijinalUrl,
      tur: m.file_type,
      yukleyen: m.guest_name,
      status: m.status,
      kategori: m.kategori,
      showroom_approved: m.showroom_approved,
      showroom_requested: m.showroom_requested,
      tarih: m.created_at,
    })),
    anilar: anilar.map((a) => ({
      id: a.id,
      guest_name: a.guest_name,
      message_text: a.message_text,
      audio_url: a.audio_url,
      tarih: a.created_at,
    })),
  });
}
