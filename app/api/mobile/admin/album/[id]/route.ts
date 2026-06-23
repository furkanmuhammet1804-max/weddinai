// GET /api/mobile/admin/album/[id] — albüm detayı (bölümlü seçili fotoğraflar +
// teslim durumu).
import { NextResponse } from "next/server";
import { adminBearerGecerli } from "@/lib/mobil/admin-token";
import { createAdminClient } from "@/lib/supabase/admin";
import { albumGetir } from "@/lib/album/veri";

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
    return NextResponse.json({ hata: "Albüm kimliği gerekli." }, { status: 400 });
  }

  const album = await albumGetir(id);
  if (!album) {
    return NextResponse.json({ hata: "Albüm bulunamadı." }, { status: 404 });
  }

  // Teslim durumu (Album tipinde yok → ayrı sorgu).
  const admin = createAdminClient();
  const { data: ek } = await admin
    .from("albumler")
    .select("teslim_edildi")
    .eq("id", id)
    .maybeSingle();

  return NextResponse.json({
    id: album.id,
    event_id: album.event_id,
    event_title: album.event_title,
    slug: album.slug,
    baslik: album.baslik,
    paket: album.paket,
    limit_adet: album.limit_adet,
    kapak_media_id: album.kapak_media_id,
    durum: album.durum,
    teslim_edildi: !!ek?.teslim_edildi,
    published_at: album.published_at,
    fotograflar: album.fotograflar,
  });
}
