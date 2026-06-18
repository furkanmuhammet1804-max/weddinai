// Yönetici davetiye durumunu günceller (yayına alırken slug atanır).
import { NextResponse } from "next/server";
import { adminOturumGecerli } from "@/lib/admin/oturum";
import {
  davetiyeDurumGuncelle,
  DAVETIYE_DURUMLAR,
  type DavetiyeDurum,
} from "@/lib/davetiye";

const GECERLI = new Set(DAVETIYE_DURUMLAR.map((d) => d.id));

export async function POST(request: Request) {
  if (!(await adminOturumGecerli())) {
    return NextResponse.json({ hata: "Yetki yok." }, { status: 401 });
  }
  let b: { id?: string; durum?: string };
  try {
    b = await request.json();
  } catch {
    return NextResponse.json({ hata: "Geçersiz istek." }, { status: 400 });
  }
  const id = (b.id ?? "").trim();
  const durum = (b.durum ?? "").trim() as DavetiyeDurum;
  if (!id || !GECERLI.has(durum)) {
    return NextResponse.json({ hata: "Eksik/geçersiz parametre." }, { status: 400 });
  }
  const sonuc = await davetiyeDurumGuncelle(id, durum);
  if (!sonuc.ok) {
    return NextResponse.json({ hata: "Güncellenemedi." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, slug: sonuc.slug });
}
