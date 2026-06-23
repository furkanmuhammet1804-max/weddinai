// POST /api/mobile/admin/giris — yönetici girişi: env kimliği (ADMIN_USERNAME/
// PASSWORD) doğrulanır (sabit-zamanlı) → imzalı admin bearer token döner.
import { NextResponse } from "next/server";
import { kimlikDogru } from "@/lib/admin/oturum";
import { adminTokenUret } from "@/lib/mobil/admin-token";
import { rateLimit, istemciIp } from "@/lib/mobil/rate-limit";

const PENCERE_MS = 60_000;
const IP_LIMIT = 10;

export async function POST(request: Request) {
  const ip = istemciIp(request);
  const kontrol = rateLimit(`admin-giris:ip:${ip}`, IP_LIMIT, PENCERE_MS);
  if (!kontrol.izin) {
    return NextResponse.json(
      { hata: "Çok fazla deneme. Lütfen biraz sonra tekrar deneyin." },
      { status: 429, headers: { "Retry-After": String(kontrol.kalanSn) } },
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
    return NextResponse.json({ hata: "Kullanıcı adı ve şifre gerekli." }, { status: 400 });
  }

  if (!kimlikDogru(kullanici, sifre)) {
    return NextResponse.json({ hata: "Kullanıcı adı veya şifre hatalı." }, { status: 401 });
  }

  return NextResponse.json({ token: adminTokenUret() });
}
