// Yönetici davetiye yönetimi: durum değiştir, yayınla/kaldır, slug belirle.
import { NextResponse } from "next/server";
import { adminOturumGecerli } from "@/lib/admin/oturum";
import {
  davetiyeDurumGuncelle,
  davetiyeSlugBelirle,
  DAVETIYE_DURUMLAR,
  type DavetiyeDurum,
} from "@/lib/davetiye";

const GECERLI = new Set(DAVETIYE_DURUMLAR.map((d) => d.id));

export async function POST(request: Request) {
  if (!(await adminOturumGecerli())) {
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

  // Slug belirleme (durum değişmeden)
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
