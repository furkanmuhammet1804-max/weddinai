// Yönetici girişi: kullanıcı adı + şifre env ile eşleşirse imzalı çerez kur.
import { NextResponse } from "next/server";
import { kimlikDogru, adminOturumKur } from "@/lib/admin/oturum";

export async function POST(request: Request) {
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
