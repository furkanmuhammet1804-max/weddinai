// Müşteri oda girişi: slug + oda şifresi → doğruysa imzalı oda çerezi.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { odaOturumKur } from "@/lib/oda/oturum";

export async function POST(request: Request) {
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
