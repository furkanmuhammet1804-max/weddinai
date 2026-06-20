// POST /api/admin/album/kaydet — albüm sırası/bölüm/kapak/başlık kaydeder.
// YALNIZCA ADMIN.
import { NextResponse } from "next/server";
import { adminOturumGecerli } from "@/lib/admin/oturum";
import { albumKaydetSema } from "@/lib/album/sema";
import { albumKaydet } from "@/lib/album/veri";

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
  const ayris = albumKaydetSema.safeParse(ham);
  if (!ayris.success) {
    return NextResponse.json({ ok: false, hata: "Eksik/hatalı alan." }, { status: 400 });
  }
  const { id, baslik, kapakMediaId, fotograflar } = ayris.data;
  const ok = await albumKaydet(id, { baslik, kapakMediaId, fotograflar });
  if (!ok) return NextResponse.json({ ok: false, hata: "Kaydedilemedi." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
