// /api/mobile/admin/oda
//   GET  → tüm odalar + medya/bekleyen sayımları
//   POST → yeni oda oluştur (web /api/admin/oda akışının birebir aynısı):
//          slug üret, şifre RPC, KVKK token, paket seçildiyse albüm hakkı.
import { NextResponse } from "next/server";
import { adminBearerGecerli } from "@/lib/mobil/admin-token";
import { adminOdalar } from "@/lib/oda/veri";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugYap, kisaEk } from "@/lib/slug";
import { albumHakkiVer } from "@/lib/album/veri";
import { onayTokenGetirVeyaUret } from "@/lib/kvkk/onay";

export const dynamic = "force-dynamic";

const GECERLI_ALBUM = new Set(["baslangic", "premium", "vip"]);
const GECERLI_TUR = new Set([
  "dugun",
  "nisan",
  "kina",
  "kurumsal_gala",
  "dogum_gunu",
  "parti",
  "diger",
]);

export async function GET(request: Request) {
  if (!adminBearerGecerli(request)) {
    return NextResponse.json({ hata: "Yetki yok." }, { status: 401 });
  }
  const odalar = await adminOdalar();
  return NextResponse.json({ odalar });
}

export async function POST(request: Request) {
  if (!adminBearerGecerli(request)) {
    return NextResponse.json({ hata: "Yetki yok." }, { status: 401 });
  }

  let body: {
    baslik?: string;
    musteri?: string;
    kullaniciAdi?: string;
    tur?: string;
    tarih?: string;
    sifre?: string;
    dijitalAlbum?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ hata: "Geçersiz istek." }, { status: 400 });
  }

  const baslik = (body.baslik ?? "").trim();
  const musteri = (body.musteri ?? "").trim();
  const kullaniciAdi = slugYap(body.kullaniciAdi ?? "");
  const sifre = body.sifre ?? "";
  const tur = GECERLI_TUR.has(body.tur ?? "") ? (body.tur as string) : "dugun";
  const tarih = (body.tarih ?? "").trim() || null;

  if (baslik.length < 2) {
    return NextResponse.json({ hata: "Oda başlığı en az 2 karakter olmalı." }, { status: 400 });
  }
  if (kullaniciAdi.length < 3) {
    return NextResponse.json({ hata: "Kullanıcı adı (oda kodu) en az 3 karakter olmalı." }, { status: 400 });
  }
  if (sifre.length < 4) {
    return NextResponse.json({ hata: "Oda şifresi en az 4 karakter olmalı." }, { status: 400 });
  }

  const admin = createAdminClient();

  let olusan: { id: string; slug: string } | null = null;
  let sonHata: string | null = null;
  for (let i = 0; i < 4; i++) {
    const slug = i === 0 ? kullaniciAdi : `${kullaniciAdi}-${kisaEk()}`;
    const { data, error } = await admin
      .from("events")
      .insert({
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
    if (error && !/duplicate|unique/i.test(error.message)) break;
  }

  if (!olusan) {
    return NextResponse.json({ hata: "Oda oluşturulamadı.", detay: sonHata }, { status: 500 });
  }

  const { error: sifreHata } = await admin.rpc("oda_sifre_ayarla", {
    p_event_id: olusan.id,
    p_password: sifre,
  });
  if (sifreHata) {
    await admin.from("events").delete().eq("id", olusan.id);
    return NextResponse.json({ hata: "Oda şifresi ayarlanamadı." }, { status: 500 });
  }

  // KVKK AI onay token'ını oluşturma anında üret (lazy değil).
  await onayTokenGetirVeyaUret(olusan.id).catch(() => null);

  // Paket seçildiyse albüm hakkını otomatik ver (satış anı modeli).
  const albumPaket = body.dijitalAlbum ?? "yok";
  if (GECERLI_ALBUM.has(albumPaket)) {
    await albumHakkiVer(olusan.id, albumPaket).catch(() => {});
  }

  return NextResponse.json({ ok: true, id: olusan.id, slug: olusan.slug });
}
