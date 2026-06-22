// =============================================================
// ALBÜM VERİSİ — sunucu tarafı (service-role). (Özellik 5 revizyonu)
//
// ÇOK ÖNEMLİ: Albümü YALNIZCA ADMIN oluşturur ve kürasyonu admin yapar.
// Müşteri yalnızca fotoğraf görüntüler, favoriler ve "albüme aday" işaretler.
// AI otomatik seçim YOKTUR; admin adaylar + favorilerden albümü elle kurar.
// Son karar her zaman adminde.
// =============================================================
import { randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugYap, kisaEk } from "@/lib/slug";
import { paketAdet, VARSAYILAN_BOLUM } from "@/lib/album/sabit";
import { odaBilgiId } from "@/lib/oda/veri";

const MEDYA_BUCKET = "event-media";
const IMZA_OMUR_SN = 60 * 60;

export interface AlbumListeSatir {
  event_id: string;
  event_title: string;
  customer_name: string | null;
  foto_sayisi: number; // odadaki fotoğraf sayısı
  aday_sayisi: number; // favori veya albüme aday işaretli
  album_id: string | null;
  durum: string | null;
  slug: string | null;
  album_foto_sayisi: number;
}

export interface AlbumFoto {
  media_id: string;
  url: string | null;
  bolum: string | null;
  sira: number;
}

// Aday/havuz fotoğrafı (admin'in albüme ekleyebileceği).
export interface HavuzFoto {
  media_id: string;
  url: string | null;
  favori: boolean;
  aday: boolean;
}

export interface Album {
  id: string;
  event_id: string;
  event_title: string;
  slug: string | null;
  baslik: string;
  paket: string;
  limit_adet: number;
  kapak_media_id: string | null;
  durum: string;
  published_at: string | null;
  fotograflar: AlbumFoto[];
}

async function imzaliUrlHaritasi(paths: string[]): Promise<Map<string, string>> {
  const harita = new Map<string, string>();
  const temiz = paths.filter(Boolean);
  if (temiz.length === 0) return harita;
  const admin = createAdminClient();
  const { data } = await admin.storage.from(MEDYA_BUCKET).createSignedUrls(temiz, IMZA_OMUR_SN);
  for (const item of data ?? [])
    if (item.path && item.signedUrl) harita.set(item.path, item.signedUrl);
  return harita;
}

// ---- Admin liste ----
export async function albumListe(): Promise<AlbumListeSatir[]> {
  const admin = createAdminClient();
  const { data: odalar } = await admin
    .from("events")
    .select("id, title, customer_name, created_at")
    .order("created_at", { ascending: false });
  const liste = odalar ?? [];
  if (liste.length === 0) return [];
  const ids = liste.map((o) => o.id as string);

  const [{ data: medyalar }, { data: albumler }] = await Promise.all([
    admin
      .from("media")
      .select("event_id, file_type, is_favorite, album_aday")
      .in("event_id", ids)
      .eq("file_type", "fotograf"),
    admin.from("albumler").select("id, event_id, durum, slug").in("event_id", ids),
  ]);

  const fotoSay = new Map<string, number>();
  const adaySay = new Map<string, number>();
  for (const m of medyalar ?? []) {
    const k = m.event_id as string;
    fotoSay.set(k, (fotoSay.get(k) ?? 0) + 1);
    if (m.is_favorite || m.album_aday) adaySay.set(k, (adaySay.get(k) ?? 0) + 1);
  }
  const albumMap = new Map((albumler ?? []).map((a) => [a.event_id as string, a]));

  const albumIds = (albumler ?? []).map((a) => a.id as string);
  const albumFotoSay = new Map<string, number>();
  if (albumIds.length) {
    const { data: foto } = await admin
      .from("album_fotograflar")
      .select("album_id")
      .in("album_id", albumIds);
    for (const f of foto ?? [])
      albumFotoSay.set(f.album_id as string, (albumFotoSay.get(f.album_id as string) ?? 0) + 1);
  }

  return liste.map((o) => {
    const a = albumMap.get(o.id as string);
    return {
      event_id: o.id as string,
      event_title: o.title as string,
      customer_name: (o.customer_name as string) ?? null,
      foto_sayisi: fotoSay.get(o.id as string) ?? 0,
      aday_sayisi: adaySay.get(o.id as string) ?? 0,
      album_id: (a?.id as string) ?? null,
      durum: (a?.durum as string) ?? null,
      slug: (a?.slug as string) ?? null,
      album_foto_sayisi: a ? (albumFotoSay.get(a.id as string) ?? 0) : 0,
    };
  });
}

// Odanın fotoğrafları (favori/aday bayraklarıyla) — albüm havuzu kaynağı.
async function odaFotograflari(eventId: string): Promise<
  { id: string; storage_path: string; favori: boolean; aday: boolean; created_at: string }[]
> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("media")
    .select("id, storage_path, is_favorite, album_aday, created_at")
    .eq("event_id", eventId)
    .eq("file_type", "fotograf")
    .neq("status", "reddedildi")
    .order("created_at", { ascending: true });
  return (data ?? []).map((m) => ({
    id: m.id as string,
    storage_path: m.storage_path as string,
    favori: !!m.is_favorite,
    aday: !!m.album_aday,
    created_at: m.created_at as string,
  }));
}

// ---- Oluştur (admin tetikler; adaylardan/favorilerden TOHUMLAR, AI seçim YOK) ----
export async function albumOlustur(
  eventId: string,
  paket: string,
  ozelAdet?: number | null,
): Promise<{ ok: boolean; id?: string; mevcut?: boolean; hata?: string }> {
  const admin = createAdminClient();

  const { data: varOlan } = await admin
    .from("albumler")
    .select("id")
    .eq("event_id", eventId)
    .maybeSingle();
  if (varOlan) return { ok: true, id: varOlan.id as string, mevcut: true };

  const fotolar = await odaFotograflari(eventId);
  if (fotolar.length === 0) {
    return { ok: false, hata: "Odada fotoğraf yok. Önce misafirler yüklemeli." };
  }

  const limit = paketAdet(paket, ozelAdet);
  // Tohum: müşterinin işaretlediği adaylar + favoriler (öncelikli), limit kadar.
  const adaylar = fotolar.filter((f) => f.aday || f.favori).slice(0, limit);

  const bilgi = await odaBilgiId(eventId);
  const { data: album, error } = await admin
    .from("albumler")
    .insert({
      event_id: eventId,
      baslik: `${bilgi?.title ?? "Düğün"} Albümü`,
      paket,
      limit_adet: limit,
      kapak_media_id: adaylar[0]?.id ?? null,
      durum: "taslak",
    })
    .select("id")
    .single();
  if (error || !album) return { ok: false, hata: "Albüm oluşturulamadı." };

  const albumId = album.id as string;
  if (adaylar.length > 0) {
    const satirlar = adaylar.map((f, i) => ({
      album_id: albumId,
      media_id: f.id,
      bolum: VARSAYILAN_BOLUM,
      sira: i,
    }));
    const { error: fErr } = await admin.from("album_fotograflar").insert(satirlar);
    if (fErr) return { ok: false, hata: "Fotoğraflar eklenemedi." };
  }

  return { ok: true, id: albumId, mevcut: false };
}

function satirCevir(row: Record<string, unknown>, eventTitle: string, fotograflar: AlbumFoto[]): Album {
  return {
    id: row.id as string,
    event_id: row.event_id as string,
    event_title: eventTitle,
    slug: (row.slug as string) ?? null,
    baslik: (row.baslik as string) ?? "Düğün Albümü",
    paket: (row.paket as string) ?? "baslangic",
    limit_adet: (row.limit_adet as number) ?? 50,
    kapak_media_id: (row.kapak_media_id as string) ?? null,
    durum: (row.durum as string) ?? "taslak",
    published_at: (row.published_at as string) ?? null,
    fotograflar,
  };
}

async function albumFotograflari(albumId: string): Promise<AlbumFoto[]> {
  const admin = createAdminClient();
  const { data: foto } = await admin
    .from("album_fotograflar")
    .select("media_id, bolum, sira, media(storage_path)")
    .eq("album_id", albumId)
    .order("sira", { ascending: true });
  const satirlar = foto ?? [];
  const harita = await imzaliUrlHaritasi(
    satirlar.map((f) => (f as { media?: { storage_path?: string } }).media?.storage_path ?? ""),
  );
  return satirlar.map((f) => {
    const path = (f as { media?: { storage_path?: string } }).media?.storage_path ?? "";
    return {
      media_id: f.media_id as string,
      url: harita.get(path) ?? null,
      bolum: (f.bolum as string) ?? null,
      sira: (f.sira as number) ?? 0,
    };
  });
}

// ---- Admin editör ----
export async function albumGetir(id: string): Promise<Album | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("albumler")
    .select("*, events(title)")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const fotograflar = await albumFotograflari(id);
  const ev = (data as { events?: { title?: string } }).events;
  return satirCevir(data, ev?.title ?? "Oda", fotograflar);
}

// "Albüme Aday Fotoğraflar" + havuz: albümde OLMAYAN oda fotoğrafları,
// favori/aday bayraklarıyla (adaylar üstte).
export async function albumHavuz(
  eventId: string,
  haricMediaIds: string[],
): Promise<HavuzFoto[]> {
  const fotolar = await odaFotograflari(eventId);
  const haric = new Set(haricMediaIds);
  const kalan = fotolar.filter((f) => !haric.has(f.id));
  const harita = await imzaliUrlHaritasi(kalan.map((f) => f.storage_path));
  const liste: HavuzFoto[] = kalan.map((f) => ({
    media_id: f.id,
    url: harita.get(f.storage_path) ?? null,
    favori: f.favori,
    aday: f.aday,
  }));
  // Adaylar/favoriler önce.
  liste.sort((a, b) => Number(b.aday || b.favori) - Number(a.aday || a.favori));
  return liste;
}

// ---- Kaydet (sıra/bölüm/kapak/başlık) ----
export interface AlbumKaydetGirdi {
  baslik: string;
  kapakMediaId: string | null;
  fotograflar: { media_id: string; bolum: string | null; sira: number }[];
}
export async function albumKaydet(id: string, g: AlbumKaydetGirdi): Promise<boolean> {
  const admin = createAdminClient();
  const { error: uErr } = await admin
    .from("albumler")
    .update({ baslik: g.baslik, kapak_media_id: g.kapakMediaId })
    .eq("id", id);
  if (uErr) return false;

  await admin.from("album_fotograflar").delete().eq("album_id", id);
  if (g.fotograflar.length === 0) return true;
  const satirlar = g.fotograflar.map((f) => ({
    album_id: id,
    media_id: f.media_id,
    bolum: f.bolum,
    sira: f.sira,
  }));
  const { error: iErr } = await admin.from("album_fotograflar").insert(satirlar);
  return !iErr;
}

// ---- Yayınla / taslağa al ----
export async function albumYayinla(
  id: string,
  yayinla: boolean,
): Promise<{ ok: boolean; slug?: string | null }> {
  const admin = createAdminClient();
  if (!yayinla) {
    const { error } = await admin.from("albumler").update({ durum: "taslak" }).eq("id", id);
    return { ok: !error };
  }
  const { data: mevcut } = await admin
    .from("albumler")
    .select("id, slug, baslik, events(title)")
    .eq("id", id)
    .maybeSingle();
  if (!mevcut) return { ok: false };
  let slug = (mevcut.slug as string) ?? null;
  if (!slug) {
    const ev = (mevcut as { events?: { title?: string } }).events;
    const taban = slugYap(ev?.title || (mevcut.baslik as string) || "album");
    slug = `${taban || "album"}-${kisaEk()}`;
  }
  const { error } = await admin
    .from("albumler")
    .update({ durum: "yayinda", slug, published_at: new Date().toISOString() })
    .eq("id", id);
  return { ok: !error, slug };
}

// Mobil/BFF: bir etkinliğin YAYINLANMIŞ albümü (varsa).
export async function albumEventYayinda(eventId: string): Promise<Album | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("albumler")
    .select("id")
    .eq("event_id", eventId)
    .eq("durum", "yayinda")
    .maybeSingle();
  if (!data) return null;
  return albumGetir(data.id as string);
}

// =============================================================
// F5 V2 — MÜŞTERİ ALBÜM SEÇİMİ (tahmin edilemez token ile public akış).
// Müşteri seçer/sıralar/kapak+bölüm belirler; admin PDF üretir. Seçim
// doğrudan albumler + album_fotograflar tablolarına yazılır (PDF aynen çalışır).
// =============================================================

function secimTokenUret(): string {
  return randomBytes(24).toString("base64url"); // 32 karakter, URL-güvenli
}

// ---- Admin: albüm hakkı ver (paket + foto limiti + müşteri seçim token'ı) ----
// Idempotent: oda için albüm satırı yoksa oluşturur; varsa paket/limit günceller.
// Tamamlanmış seçim varsa durumu bozmaz. Müşteri linki: /album-sec/<token>.
export async function albumHakkiVer(
  eventId: string,
  paket: string,
  ozelAdet?: number | null,
): Promise<{ ok: boolean; token?: string; hata?: string }> {
  const admin = createAdminClient();
  const limit = paketAdet(paket, ozelAdet);

  const { data: varOlan } = await admin
    .from("albumler")
    .select("id, secim_token, secim_tamamlandi")
    .eq("event_id", eventId)
    .maybeSingle();

  if (varOlan) {
    let token = (varOlan.secim_token as string) ?? null;
    const yama: Record<string, unknown> = { paket, limit_adet: limit };
    if (!token) {
      token = secimTokenUret();
      yama.secim_token = token;
    }
    // Tamamlanmamışsa müşteri hâlâ seçim yapabilsin (durum=secim).
    if (!varOlan.secim_tamamlandi) yama.durum = "secim";
    const { error } = await admin.from("albumler").update(yama).eq("id", varOlan.id);
    if (error) return { ok: false, hata: "Albüm güncellenemedi." };
    return { ok: true, token: token! };
  }

  const bilgi = await odaBilgiId(eventId);
  const token = secimTokenUret();
  const { error } = await admin.from("albumler").insert({
    event_id: eventId,
    baslik: `${bilgi?.title ?? "Düğün"} Albümü`,
    paket,
    limit_adet: limit,
    durum: "secim",
    secim_token: token,
  });
  if (error) return { ok: false, hata: "Albüm hakkı verilemedi." };
  return { ok: true, token };
}

// =============================================================
// F5 V3 — ALBÜM HAKKI (satış anı modeli). Hak oda oluşturmada verilir;
// talep/onay süreci YOKTUR. Müşteri paneli hak varsa "Dijital Albüm" sekmesi gösterir.
// =============================================================

export interface AlbumHakBilgi {
  album_id: string;
  paket: string;
  limit_adet: number;
  secim_token: string | null;
  secim_tamamlandi: boolean;
  secili_sayisi: number;
}

// Müşteri paneli/oda sayfası için: bu odanın albüm hakkı (yoksa null).
// Hak = secim_token'lı albumler satırının varlığı.
export async function albumHakDurum(eventId: string): Promise<AlbumHakBilgi | null> {
  const admin = createAdminClient();
  const { data: a } = await admin
    .from("albumler")
    .select("id, paket, limit_adet, secim_token, secim_tamamlandi")
    .eq("event_id", eventId)
    .not("secim_token", "is", null)
    .maybeSingle();
  if (!a) return null;
  const { count } = await admin
    .from("album_fotograflar")
    .select("id", { count: "exact", head: true })
    .eq("album_id", a.id as string);
  return {
    album_id: a.id as string,
    paket: (a.paket as string) ?? "baslangic",
    limit_adet: (a.limit_adet as number) ?? 50,
    secim_token: (a.secim_token as string) ?? null,
    secim_tamamlandi: !!a.secim_tamamlandi,
    secili_sayisi: count ?? 0,
  };
}

// Admin: albümü "teslim edildi" işaretler/geri alır (Albüm Siparişleri).
export async function albumTeslimEt(
  albumId: string,
  teslim: boolean,
): Promise<{ ok: boolean; hata?: string }> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("albumler")
    .update({
      teslim_edildi: teslim,
      teslim_edildi_at: teslim ? new Date().toISOString() : null,
    })
    .eq("id", albumId);
  if (error) return { ok: false, hata: "Güncellenemedi." };
  return { ok: true };
}

// ---- Müşteri seçim ekranı verisi (token ile, yalnız o odanın fotoğrafları) ----
export interface AlbumSecimVeri {
  album_id: string;
  baslik: string;
  paket: string;
  limit_adet: number;
  event_title: string;
  kapak_media_id: string | null;
  tamamlandi: boolean;
  tamamlandi_at: string | null;
  secili: AlbumFoto[];
  havuz: { media_id: string; url: string | null }[];
}

export async function albumSecimGetir(token: string): Promise<AlbumSecimVeri | null> {
  if (!token || token.length < 16) return null;
  const admin = createAdminClient();
  const { data: a } = await admin
    .from("albumler")
    .select(
      "id, event_id, baslik, paket, limit_adet, kapak_media_id, secim_tamamlandi, secim_tamamlandi_at, events(title)",
    )
    .eq("secim_token", token)
    .maybeSingle();
  if (!a) return null;

  const eventId = a.event_id as string;
  const secili = await albumFotograflari(a.id as string); // sira'ya göre sıralı
  const seciliSet = new Set(secili.map((f) => f.media_id));

  // Havuz = bu odanın HENÜZ seçilmemiş fotoğrafları (yalnız bu oda — güvenlik).
  const fotolar = await odaFotograflari(eventId);
  const kalan = fotolar.filter((f) => !seciliSet.has(f.id));
  const harita = await imzaliUrlHaritasi(kalan.map((f) => f.storage_path));
  const havuz = kalan.map((f) => ({
    media_id: f.id,
    url: harita.get(f.storage_path) ?? null,
  }));

  const ev = (a as { events?: { title?: string } }).events;
  return {
    album_id: a.id as string,
    baslik: (a.baslik as string) ?? "Düğün Albümü",
    paket: (a.paket as string) ?? "baslangic",
    limit_adet: (a.limit_adet as number) ?? 50,
    event_title: ev?.title ?? "",
    kapak_media_id: (a.kapak_media_id as string) ?? null,
    tamamlandi: !!a.secim_tamamlandi,
    tamamlandi_at: (a.secim_tamamlandi_at as string) ?? null,
    secili,
    havuz,
  };
}

// ---- Müşteri seçimini kaydet (limit + sahiplik doğrulaması) ----
export async function albumSecimKaydet(
  token: string,
  g: {
    kapakMediaId: string | null;
    fotograflar: { media_id: string; bolum: string | null; sira: number }[];
  },
): Promise<{ ok: boolean; hata?: string }> {
  if (!token || token.length < 16) return { ok: false, hata: "Geçersiz bağlantı." };
  const admin = createAdminClient();
  const { data: a } = await admin
    .from("albumler")
    .select("id, event_id, limit_adet, secim_tamamlandi")
    .eq("secim_token", token)
    .maybeSingle();
  if (!a) return { ok: false, hata: "Albüm bulunamadı." };
  if (a.secim_tamamlandi)
    return { ok: false, hata: "Seçiminiz tamamlandı; değişiklik yapılamaz." };

  const limit = (a.limit_adet as number) ?? 50;
  if (g.fotograflar.length > limit)
    return { ok: false, hata: `En fazla ${limit} fotoğraf seçebilirsiniz.` };

  // Güvenlik: seçilen tüm medya gerçekten bu odaya mı ait?
  const eventId = a.event_id as string;
  const ids = g.fotograflar.map((f) => f.media_id);
  if (ids.length) {
    const { data: ait } = await admin
      .from("media")
      .select("id")
      .eq("event_id", eventId)
      .in("id", ids);
    if ((ait?.length ?? 0) !== ids.length)
      return { ok: false, hata: "Geçersiz fotoğraf seçimi." };
  }

  const kapak =
    g.kapakMediaId && ids.includes(g.kapakMediaId) ? g.kapakMediaId : (ids[0] ?? null);
  const { error: uErr } = await admin
    .from("albumler")
    .update({ kapak_media_id: kapak })
    .eq("id", a.id);
  if (uErr) return { ok: false, hata: "Kaydedilemedi." };

  await admin.from("album_fotograflar").delete().eq("album_id", a.id);
  if (g.fotograflar.length) {
    const satirlar = g.fotograflar.map((f) => ({
      album_id: a.id,
      media_id: f.media_id,
      bolum: f.bolum,
      sira: f.sira,
    }));
    const { error: iErr } = await admin.from("album_fotograflar").insert(satirlar);
    if (iErr) return { ok: false, hata: "Fotoğraflar kaydedilemedi." };
  }
  return { ok: true };
}

// ---- Müşteri seçimini tamamla (readonly kilidi) ----
export async function albumSecimTamamla(
  token: string,
): Promise<{ ok: boolean; hata?: string }> {
  if (!token || token.length < 16) return { ok: false, hata: "Geçersiz bağlantı." };
  const admin = createAdminClient();
  const { data: a } = await admin
    .from("albumler")
    .select("id, secim_tamamlandi")
    .eq("secim_token", token)
    .maybeSingle();
  if (!a) return { ok: false, hata: "Albüm bulunamadı." };
  if (a.secim_tamamlandi) return { ok: true }; // idempotent
  const { error } = await admin
    .from("albumler")
    .update({
      secim_tamamlandi: true,
      secim_tamamlandi_at: new Date().toISOString(),
      durum: "taslak",
    })
    .eq("id", a.id);
  if (error) return { ok: false, hata: "Tamamlanamadı." };
  return { ok: true };
}

// ---- Müşteri: token ile tam albümü getir (PDF üretimi için) ----
// Müşteri kendi seçtiği albümün PDF'ini indirebilsin diye token → Album köprüsü.
// Admin müdahalesi GEREKMEZ; PDF talep anında üretilir.
export async function albumSecimAlbumGetir(token: string): Promise<Album | null> {
  if (!token || token.length < 16) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from("albumler")
    .select("id")
    .eq("secim_token", token)
    .maybeSingle();
  if (!data) return null;
  return albumGetir(data.id as string);
}

// ---- Admin: Albüm Siparişleri listesi (hak verilmiş tüm odalar) ----
export interface AlbumSiparisSatir {
  album_id: string;
  event_id: string;
  event_title: string;
  customer_name: string | null;
  paket: string;
  limit_adet: number;
  secili_sayisi: number;
  tamamlandi: boolean;
  tamamlandi_at: string | null;
  secim_token: string | null;
  teslim_edildi: boolean;
}

export async function albumSiparisListe(): Promise<AlbumSiparisSatir[]> {
  const admin = createAdminClient();
  const { data: albumler } = await admin
    .from("albumler")
    .select(
      "id, event_id, paket, limit_adet, secim_tamamlandi, secim_tamamlandi_at, secim_token, teslim_edildi, created_at, events(title, customer_name)",
    )
    .not("secim_token", "is", null)
    .order("created_at", { ascending: false });
  const liste = albumler ?? [];
  if (liste.length === 0) return [];

  const ids = liste.map((a) => a.id as string);
  const { data: foto } = await admin
    .from("album_fotograflar")
    .select("album_id")
    .in("album_id", ids);
  const say = new Map<string, number>();
  for (const f of foto ?? [])
    say.set(f.album_id as string, (say.get(f.album_id as string) ?? 0) + 1);

  return liste.map((a) => {
    const ev = (a as { events?: { title?: string; customer_name?: string } }).events;
    return {
      album_id: a.id as string,
      event_id: a.event_id as string,
      event_title: ev?.title ?? "Oda",
      customer_name: ev?.customer_name ?? null,
      paket: (a.paket as string) ?? "baslangic",
      limit_adet: (a.limit_adet as number) ?? 50,
      secili_sayisi: say.get(a.id as string) ?? 0,
      tamamlandi: !!a.secim_tamamlandi,
      tamamlandi_at: (a.secim_tamamlandi_at as string) ?? null,
      secim_token: (a.secim_token as string) ?? null,
      teslim_edildi: !!a.teslim_edildi,
    };
  });
}

// ---- Public okuma ----
export async function albumSlugIle(slug: string): Promise<Album | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("albumler")
    .select("*, events(title)")
    .ilike("slug", slug)
    .eq("durum", "yayinda")
    .maybeSingle();
  if (!data) return null;
  const fotograflar = await albumFotograflari(data.id as string);
  const ev = (data as { events?: { title?: string } }).events;
  return satirCevir(data, ev?.title ?? "", fotograflar);
}
