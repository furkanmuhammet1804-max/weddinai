// Public davetiye talebi (metin alanları). Medya dosyaları ayrı yüklenir.
import { NextResponse } from "next/server";
import {
  davetiyeOlustur,
  type DavetiyeGirdi,
  type Etkinlik,
} from "@/lib/davetiye";
import { TEMA_IDLER, type DavetiyeTemaId } from "@/lib/davetiye-tema";

const kirp = (v: unknown, n: number) =>
  typeof v === "string" ? v.trim().slice(0, n) || null : null;

// Gelen etkinlik listesini güvenli biçimde temizler (en fazla 10, türü olanlar).
function etkinlikleriTemizle(v: unknown): Etkinlik[] {
  if (!Array.isArray(v)) return [];
  const out: Etkinlik[] = [];
  for (const e of v) {
    if (!e || typeof e !== "object") continue;
    const o = e as Record<string, unknown>;
    const tur = kirp(o.tur, 40);
    if (!tur) continue; // tür yoksa boş satırdır, atla
    out.push({
      tur,
      tarih: kirp(o.tarih, 20),
      saat: kirp(o.saat, 20),
      mekan: kirp(o.mekan, 160),
      adres: kirp(o.adres, 300),
      maps: kirp(o.maps, 500),
    });
    if (out.length >= 10) break;
  }
  return out;
}

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

  const tema: DavetiyeTemaId = TEMA_IDLER.includes(b.tema as DavetiyeTemaId)
    ? (b.tema as DavetiyeTemaId)
    : "ivory";

  const girdi: DavetiyeGirdi = {
    gelin_ad,
    damat_ad,
    phone,
    email: email?.toLowerCase() ?? null,
    etkinlikler: etkinlikleriTemizle(b.etkinlikler),
    gelin_aile: kirp(b.gelin_aile, 500),
    damat_aile: kirp(b.damat_aile, 500),
    mesaj: kirp(b.mesaj, 1500),
    notlar: kirp(b.notlar, 1500),
    muzik_youtube: kirp(b.muzik_youtube, 300),
    tema,
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
