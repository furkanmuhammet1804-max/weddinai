// POST /api/admin/medya/sinif — admin bir fotoğrafın kategorisini değiştirir
// (override; kaynak='admin'). YALNIZCA ADMIN.
import { NextResponse } from "next/server";
import { adminOturumGecerli } from "@/lib/admin/oturum";
import { medyaSinifSema } from "@/lib/medya/sema";
import { kategoriDegistir } from "@/lib/medya/veri";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await adminOturumGecerli())) {
    return NextResponse.json({ ok: false, hata: "Yetki yok." }, { status: 401 });
  }
  let ham: unknown;
  try {
    ham = await request.json();
  } catch {
    return NextResponse.json({ ok: false, hata: "Geçersiz istek." }, { status: 400 });
  }
  const ayris = medyaSinifSema.safeParse(ham);
  if (!ayris.success) {
    return NextResponse.json({ ok: false, hata: "Geçersiz kategori." }, { status: 400 });
  }
  const { mediaId, kategori } = ayris.data;
  const ok = await kategoriDegistir(mediaId, kategori);
  if (!ok) return NextResponse.json({ ok: false, hata: "Güncellenemedi." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
