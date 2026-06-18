// Public davetiye talebi (metin alanları). Medya dosyaları ayrı yüklenir.
import { NextResponse } from "next/server";
import { davetiyeOlustur, type DavetiyeGirdi } from "@/lib/davetiye";

const kirp = (v: unknown, n: number) =>
  typeof v === "string" ? v.trim().slice(0, n) || null : null;

export async function POST(request: Request) {
  let b: Record<string, unknown>;
  try {
    b = await request.json();
  } catch {
    return NextResponse.json({ hata: "Geçersiz istek." }, { status: 400 });
  }

  const gelin_ad = kirp(b.gelin_ad, 80);
  const damat_ad = kirp(b.damat_ad, 80);
  if (!gelin_ad || !damat_ad) {
    return NextResponse.json(
      { hata: "Gelin ve damat adı zorunludur." },
      { status: 400 },
    );
  }
  const phone = kirp(b.phone, 30);
  const email = kirp(b.email, 120);
  if (!phone && !email) {
    return NextResponse.json(
      { hata: "Size ulaşabilmemiz için telefon veya e-posta gerekli." },
      { status: 400 },
    );
  }

  const girdi: DavetiyeGirdi = {
    gelin_ad,
    damat_ad,
    phone,
    email: email?.toLowerCase() ?? null,
    kina_tarih: kirp(b.kina_tarih, 20),
    kina_saat: kirp(b.kina_saat, 20),
    kina_mekan: kirp(b.kina_mekan, 160),
    kina_adres: kirp(b.kina_adres, 300),
    kina_maps: kirp(b.kina_maps, 500),
    dugun_tarih: kirp(b.dugun_tarih, 20),
    dugun_saat: kirp(b.dugun_saat, 20),
    dugun_mekan: kirp(b.dugun_mekan, 160),
    dugun_adres: kirp(b.dugun_adres, 300),
    dugun_maps: kirp(b.dugun_maps, 500),
    mesaj: kirp(b.mesaj, 1500),
    notlar: kirp(b.notlar, 1500),
    muzik_youtube: kirp(b.muzik_youtube, 300),
  };

  const id = await davetiyeOlustur(girdi);
  if (!id) {
    return NextResponse.json(
      { hata: "Talep kaydedilemedi. Lütfen tekrar deneyin." },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true, id });
}
