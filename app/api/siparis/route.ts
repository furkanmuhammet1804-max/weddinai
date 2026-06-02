// Public sipariş/talep alma. Anon'a tablo erişimi yok; service_role ile insert.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const GECERLI_PAKET = new Set(["baslangic", "standart", "premium"]);
const GECERLI_TUR = new Set([
  "dugun",
  "nisan",
  "kina",
  "kurumsal_gala",
  "dogum_gunu",
  "parti",
  "diger",
]);

export async function POST(request: Request) {
  let body: Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ hata: "Geçersiz istek." }, { status: 400 });
  }

  const paket = GECERLI_PAKET.has(body.paket) ? body.paket : "standart";
  const customer_name = (body.customer_name ?? "").trim();
  const event_type = GECERLI_TUR.has(body.event_type) ? body.event_type : null;
  const event_date = (body.event_date ?? "").trim() || null;
  const phone = (body.phone ?? "").trim() || null;
  const email = (body.email ?? "").trim().toLowerCase() || null;
  const note = (body.note ?? "").trim().slice(0, 1000) || null;

  if (customer_name.length < 2) {
    return NextResponse.json(
      { hata: "Lütfen ad soyad / çift adını girin." },
      { status: 400 },
    );
  }
  if (!phone && !email) {
    return NextResponse.json(
      { hata: "Size ulaşabilmemiz için telefon veya e-posta gerekli." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { error } = await admin.from("talepler").insert({
    paket,
    customer_name,
    event_type,
    event_date,
    phone,
    email,
    note,
  });
  if (error) {
    return NextResponse.json(
      { hata: "Talep kaydedilemedi. Lütfen tekrar deneyin." },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}
