// GET /api/mobile/admin/davetiye/[id] — davetiye detayı + RSVP listesi.
import { NextResponse } from "next/server";
import { adminBearerGecerli } from "@/lib/mobil/admin-token";
import { davetiyeGetir, rsvpListe } from "@/lib/davetiye";

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
    return NextResponse.json({ hata: "Davetiye kimliği gerekli." }, { status: 400 });
  }

  const d = await davetiyeGetir(id);
  if (!d) {
    return NextResponse.json({ hata: "Davetiye bulunamadı." }, { status: 404 });
  }
  const rsvp = await rsvpListe(id);

  return NextResponse.json({
    id: d.id,
    gelin_ad: d.gelin_ad,
    damat_ad: d.damat_ad,
    durum: d.durum,
    slug: d.slug,
    phone: d.phone ?? null,
    email: d.email ?? null,
    tema: d.tema ?? null,
    mesaj: d.mesaj ?? null,
    notlar: d.notlar ?? null,
    etkinlikler: d.etkinlikler ?? [],
    created_at: d.created_at,
    published_at: d.published_at ?? null,
    rsvp,
  });
}
