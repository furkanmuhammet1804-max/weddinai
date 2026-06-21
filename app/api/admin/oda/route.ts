// Yönetici yeni oda oluşturur. service_role ile (admin Supabase kullanıcısı yok).
import { NextResponse } from "next/server";
import { adminOturumGecerli } from "@/lib/admin/oturum";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugYap, kisaEk } from "@/lib/slug";
import { albumHakkiVer } from "@/lib/album/veri";
import { onayTokenGetirVeyaUret } from "@/lib/kvkk/onay";

// Oda oluşturmada seçilebilen dijital albüm paketleri ("yok" hariç hak tanımlanır).
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

export async function POST(request: Request) {
  if (!(await adminOturumGecerli())) {
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
    return NextResponse.json(
      { hata: "Oda başlığı en az 2 karakter olmalı." },
      { status: 400 },
    );
  }
  if (kullaniciAdi.length < 3) {
    return NextResponse.json(
      { hata: "Kullanıcı adı (oda kodu) en az 3 karakter olmalı." },
      { status: 400 },
    );
  }
  if (sifre.length < 4) {
    return NextResponse.json(
      { hata: "Oda şifresi en az 4 karakter olmalı." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  // İlk denemede yöneticinin verdiği kullanıcı adı; çakışırsa sonuna ek gelir.
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
    return NextResponse.json(
      { hata: "Oda oluşturulamadı.", detay: sonHata },
      { status: 500 },
    );
  }

  const { error: sifreHata } = await admin.rpc("oda_sifre_ayarla", {
    p_event_id: olusan.id,
    p_password: sifre,
  });
  if (sifreHata) {
    await admin.from("events").delete().eq("id", olusan.id);
    return NextResponse.json(
      { hata: "Oda şifresi ayarlanamadı." },
      { status: 500 },
    );
  }

  // KVKK AI onay token'ını OLUŞTURMA ANINDA üret (lazy değil). Böylece admin
  // oda detayına ilk girişte token hazır olur; "Onay linki üretilemedi" hatası
  // ve race condition ortadan kalkar. Hata oda oluşumunu bozmaz.
  await onayTokenGetirVeyaUret(olusan.id).catch(() => null);

  // Satış anı modeli: paket seçildiyse albüm hakkını oda oluşturmada otomatik ver
  // (token üretilir, müşteri seçim ekranı aktif olur). Hata oda oluşumunu bozmaz.
  const albumPaket = body.dijitalAlbum ?? "yok";
  if (GECERLI_ALBUM.has(albumPaket)) {
    await albumHakkiVer(olusan.id, albumPaket).catch(() => {});
  }

  return NextResponse.json({ ok: true, id: olusan.id, slug: olusan.slug });
}
