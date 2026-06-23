// /api/mobile/admin/davetiye
//   GET  → tüm davetiye talepleri (durum + RSVP sayısı)
//   POST → durum güncelle veya yayın bağlantısı (slug) belirle
import { NextResponse } from "next/server";
import { adminBearerGecerli } from "@/lib/mobil/admin-token";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  davetiyeListe,
  davetiyeDurumGuncelle,
  davetiyeSlugBelirle,
  DAVETIYE_DURUMLAR,
  type DavetiyeDurum,
} from "@/lib/davetiye";

export const dynamic = "force-dynamic";

const GECERLI = new Set(DAVETIYE_DURUMLAR.map((d) => d.id));

export async function GET(request: Request) {
  if (!adminBearerGecerli(request)) {
    return NextResponse.json({ hata: "Yetki yok." }, { status: 401 });
  }

  const liste = await davetiyeListe();

  // RSVP sayıları (tek sorgu → tally).
  const admin = createAdminClient();
  const sayim = new Map<string, number>();
  if (liste.length > 0) {
    const { data: rsvpler } = await admin
      .from("davetiye_rsvp")
      .select("davetiye_id")
      .in("davetiye_id", liste.map((d) => d.id));
    for (const r of rsvpler ?? []) {
      const k = r.davetiye_id as string;
      sayim.set(k, (sayim.get(k) ?? 0) + 1);
    }
  }

  const davetiyeler = liste.map((d) => ({
    id: d.id,
    gelin_ad: d.gelin_ad,
    damat_ad: d.damat_ad,
    durum: d.durum,
    slug: d.slug,
    phone: d.phone ?? null,
    created_at: d.created_at,
    rsvp_sayi: sayim.get(d.id) ?? 0,
  }));

  return NextResponse.json({ davetiyeler });
}

export async function POST(request: Request) {
  if (!adminBearerGecerli(request)) {
    return NextResponse.json({ hata: "Yetki yok." }, { status: 401 });
  }

  let b: { id?: string; durum?: string; slug?: string };
  try {
    b = await request.json();
  } catch {
    return NextResponse.json({ hata: "Geçersiz istek." }, { status: 400 });
  }

  const id = (b.id ?? "").trim();
  if (!id) return NextResponse.json({ hata: "id gerekli." }, { status: 400 });

  // Slug belirleme (durum değişmeden).
  if (typeof b.slug === "string" && b.slug.trim() && !b.durum) {
    const s = await davetiyeSlugBelirle(id, b.slug);
    if (!s.ok) return NextResponse.json({ hata: s.hata }, { status: 400 });
    return NextResponse.json({ ok: true, slug: s.slug });
  }

  const durum = (b.durum ?? "").trim() as DavetiyeDurum;
  if (!GECERLI.has(durum)) {
    return NextResponse.json({ hata: "Geçersiz durum." }, { status: 400 });
  }
  const sonuc = await davetiyeDurumGuncelle(id, durum);
  if (!sonuc.ok) {
    return NextResponse.json({ hata: "Güncellenemedi." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, slug: sonuc.slug });
}
