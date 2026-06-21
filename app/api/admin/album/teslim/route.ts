// POST /api/admin/album/teslim — admin albümü "teslim edildi" işaretler/geri alır.
// YALNIZCA ADMIN.
import { NextResponse } from "next/server";
import { adminOturumGecerli } from "@/lib/admin/oturum";
import { albumTeslimSema } from "@/lib/album/sema";
import { albumTeslimEt } from "@/lib/album/veri";

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
  const ayris = albumTeslimSema.safeParse(ham);
  if (!ayris.success) {
    return NextResponse.json({ ok: false, hata: "Eksik/hatalı alan." }, { status: 400 });
  }
  const sonuc = await albumTeslimEt(ayris.data.albumId, ayris.data.teslim);
  if (!sonuc.ok) {
    return NextResponse.json({ ok: false, hata: sonuc.hata ?? "İşlem başarısız." }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
