// Yönetici yeni oda (etkinlik) oluşturur. Authenticated; RLS + owner.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { slugYap, kisaEk } from "@/lib/slug";

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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ hata: "Giriş gerekli." }, { status: 401 });
  }

  let body: {
    baslik?: string;
    musteri?: string;
    tur?: string;
    tarih?: string;
    sifre?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ hata: "Geçersiz istek." }, { status: 400 });
  }

  const baslik = (body.baslik ?? "").trim();
  const musteri = (body.musteri ?? "").trim();
  const sifre = body.sifre ?? "";
  const tur = GECERLI_TUR.has(body.tur ?? "") ? (body.tur as string) : "dugun";
  const tarih = (body.tarih ?? "").trim() || null;

  if (baslik.length < 2) {
    return NextResponse.json(
      { hata: "Oda başlığı en az 2 karakter olmalı." },
      { status: 400 },
    );
  }
  if (sifre.length < 4) {
    return NextResponse.json(
      { hata: "Oda şifresi en az 4 karakter olmalı." },
      { status: 400 },
    );
  }

  const taban = slugYap(baslik) || "oda";

  // Benzersiz slug için birkaç deneme.
  let olusan: { id: string; slug: string } | null = null;
  let sonHata: string | null = null;
  for (let i = 0; i < 4; i++) {
    const slug = `${taban}-${kisaEk()}`;
    const { data, error } = await supabase
      .from("events")
      .insert({
        user_id: user.id,
        title: baslik,
        customer_name: musteri || null,
        event_type: tur,
        event_date: tarih,
        slug,
        status: "aktif",
      })
      .select("id, slug")
      .single();
    if (!error && data) {
      olusan = { id: data.id as string, slug: data.slug as string };
      break;
    }
    sonHata = error?.message ?? "Bilinmeyen hata";
    // unique violation ise tekrar dene; değilse çık.
    if (error && !/duplicate|unique/i.test(error.message)) break;
  }

  if (!olusan) {
    return NextResponse.json(
      { hata: "Oda oluşturulamadı.", detay: sonHata },
      { status: 500 },
    );
  }

  // Oda şifresini güvenli RPC ile belirle (bcrypt).
  const { error: sifreHata } = await supabase.rpc("oda_sifre_belirle", {
    p_event_id: olusan.id,
    p_password: sifre,
  });
  if (sifreHata) {
    // Şifre kurulamadıysa odayı geri al (yarım oda kalmasın).
    await supabase.from("events").delete().eq("id", olusan.id);
    return NextResponse.json(
      { hata: "Oda şifresi ayarlanamadı." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, id: olusan.id, slug: olusan.slug });
}
