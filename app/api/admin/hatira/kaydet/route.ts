// POST /api/admin/hatira/kaydet — admin'in düzenlediği defter içeriğini
// (AES-256 şifreli) kaydeder. YALNIZCA ADMIN (§7).
import { NextResponse } from "next/server";
import { adminOturumGecerli } from "@/lib/admin/oturum";
import { sifrelemeHazirMi } from "@/lib/guvenlik/sifrele";
import { hatiraKaydetSema } from "@/lib/hatira/sema";
import { hatiraIcerikKaydet } from "@/lib/hatira/veri";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await adminOturumGecerli())) {
    return NextResponse.json({ ok: false, hata: "Yetki yok." }, { status: 401 });
  }
  if (!sifrelemeHazirMi()) {
    return NextResponse.json(
      { ok: false, hata: "Şifreleme anahtarı yapılandırılmamış." },
      { status: 500 },
    );
  }

  let ham: unknown;
  try {
    ham = await request.json();
  } catch {
    return NextResponse.json({ ok: false, hata: "Geçersiz istek." }, { status: 400 });
  }
  const ayris = hatiraKaydetSema.safeParse(ham);
  if (!ayris.success) {
    return NextResponse.json({ ok: false, hata: "Eksik/hatalı alan." }, { status: 400 });
  }
  const { id, baslik, icerik } = ayris.data;

  const ok = await hatiraIcerikKaydet(id, baslik, icerik);
  if (!ok) return NextResponse.json({ ok: false, hata: "Kaydedilemedi." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
