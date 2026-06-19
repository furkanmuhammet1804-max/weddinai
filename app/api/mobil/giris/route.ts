// Mobil oda girişi: oda kodu (slug) + şifre → web ile AYNI RPC (oda_dogrula)
// service-role ile çağrılır; doğruysa imzalı bearer token döner.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { mobilTokenUret } from "@/lib/mobil/token";

export async function POST(request: Request) {
  let body: { kod?: string; sifre?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ hata: "Geçersiz istek." }, { status: 400 });
  }

  const kod = (body.kod ?? "").trim();
  const sifre = body.sifre ?? "";
  if (!kod || !sifre) {
    return NextResponse.json(
      { hata: "Oda kodu ve şifre gerekli." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("oda_dogrula", {
    p_slug: kod,
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
      { hata: "Oda kodu veya şifre hatalı." },
      { status: 401 },
    );
  }
  if (oda.status !== "aktif") {
    return NextResponse.json(
      { hata: "Bu oda şu an erişime kapalı." },
      { status: 403 },
    );
  }

  const token = mobilTokenUret(oda.id as string, oda.slug as string);
  return NextResponse.json({
    token,
    oda: {
      id: oda.id,
      kod: oda.slug,
      title: oda.title,
      event_type: oda.event_type,
      event_date: oda.event_date,
    },
  });
}
