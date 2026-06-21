// Müşteri oda girişi: slug + oda şifresi → doğruysa imzalı oda çerezi.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { odaOturumKur } from "@/lib/oda/oturum";
import { rateLimit, istemciIp } from "@/lib/mobil/rate-limit";

export async function POST(request: Request) {
  // Brute-force koruması: IP başına ve IP×oda başına hız limiti (mobil giriş ile aynı).
  const ip = istemciIp(request);
  const ipLim = rateLimit(`oda-giris:ip:${ip}`, 10, 60_000);
  if (!ipLim.izin) {
    return NextResponse.json({ hata: "Çok fazla deneme. Lütfen biraz sonra tekrar deneyin." }, {
      status: 429,
      headers: { "Retry-After": String(ipLim.kalanSn) },
    });
  }

  let body: { slug?: string; sifre?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ hata: "Geçersiz istek." }, { status: 400 });
  }

  const slug = (body.slug ?? "").trim();
  const sifre = body.sifre ?? "";
  if (!slug || !sifre) {
    return NextResponse.json(
      { hata: "Oda ve şifre gerekli." },
      { status: 400 },
    );
  }

  // Aynı odaya yoğun şifre denemesini sınırla (IP × oda).
  const odaLim = rateLimit(`oda-giris:oda:${ip}:${slug.toLowerCase()}`, 5, 60_000);
  if (!odaLim.izin) {
    return NextResponse.json({ hata: "Çok fazla deneme. Lütfen biraz sonra tekrar deneyin." }, {
      status: 429,
      headers: { "Retry-After": String(odaLim.kalanSn) },
    });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("oda_dogrula", {
    p_slug: slug,
    p_password: sifre,
  });
  if (error) {
    return NextResponse.json(
      { hata: "Doğrulama sırasında bir hata oluştu." },
      { status: 500 },
    );
  }

  const oda = Array.isArray(data) ? data[0] : data;
  if (!oda) {
    return NextResponse.json(
      { hata: "Oda şifresi hatalı." },
      { status: 401 },
    );
  }

  await odaOturumKur(oda.id as string, oda.slug as string);
  return NextResponse.json({ ok: true, slug: oda.slug });
}
