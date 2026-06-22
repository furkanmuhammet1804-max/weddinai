// Yönetici girişi: kullanıcı adı + şifre env ile eşleşirse imzalı çerez kur.
import { NextResponse } from "next/server";
import { kimlikDogru, adminOturumKur } from "@/lib/admin/oturum";
import { rateLimit, istemciIp } from "@/lib/mobil/rate-limit";

export async function POST(request: Request) {
  // Brute-force koruması: sistemin en hassas kimliği (full service-role) — oda
  // girişiyle aynı seviyede IP başına hız sınırı.
  const ip = istemciIp(request);
  const lim = rateLimit(`admin-giris:${ip}`, 8, 60_000);
  if (!lim.izin) {
    return NextResponse.json(
      { hata: "Çok fazla deneme. Lütfen biraz sonra tekrar deneyin." },
      { status: 429, headers: { "Retry-After": String(lim.kalanSn) } },
    );
  }

  let body: { kullanici?: string; sifre?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ hata: "Geçersiz istek." }, { status: 400 });
  }

  const kullanici = (body.kullanici ?? "").trim();
  const sifre = body.sifre ?? "";
  if (!kullanici || !sifre) {
    return NextResponse.json(
      { hata: "Kullanıcı adı ve şifre gerekli." },
      { status: 400 },
    );
  }

  if (!kimlikDogru(kullanici, sifre)) {
    return NextResponse.json(
      { hata: "Kullanıcı adı veya şifre hatalı." },
      { status: 401 },
    );
  }

  await adminOturumKur();
  return NextResponse.json({ ok: true });
}
