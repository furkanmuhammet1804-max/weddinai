// =============================================================
// ALBÜM VERİSİ — sunucu tarafı (service-role). (Özellik 5)
// Admin albüm oluşturma/düzenleme/yayınlama + public okuma.
// =============================================================
import { createAdminClient } from "@/lib/supabase/admin";
import { slugYap, kisaEk } from "@/lib/slug";
import { paketAdet } from "@/lib/album/sabit";
import { albumSec } from "@/lib/album/sec";
import { analizHamListe, analizListesi, type AnalizFoto } from "@/lib/medya/veri";
import { odaBilgiId } from "@/lib/oda/veri";

const MEDYA_BUCKET = "event-media";
const IMZA_OMUR_SN = 60 * 60;

export interface AlbumListeSatir {
  event_id: string;
  event_title: string;
  customer_name: string | null;
  analiz_edilen: number;
  album_id: string | null;
  durum: string | null;
  slug: string | null;
  foto_sayisi: number;
}

export interface AlbumFoto {
  media_id: string;
  url: string | null;
  bolum: string | null;
  sira: number;
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
  const { data } = await admin.storage
    .from(MEDYA_BUCKET)
    .createSignedUrls(temiz, IMZA_OMUR_SN);
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
      .select("event_id")
      .in("event_id", ids)
      .eq("file_type", "fotograf")
      .eq("ai_analiz_durum", "analiz_edildi"),
    admin.from("albumler").select("id, event_id, durum, slug").in("event_id", ids),
  ]);

  const analizSay = new Map<string, number>();
  for (const m of medyalar ?? [])
    analizSay.set(m.event_id as string, (analizSay.get(m.event_id as string) ?? 0) + 1);
  const albumMap = new Map((albumler ?? []).map((a) => [a.event_id as string, a]));

  // Albüm foto sayıları.
  const albumIds = (albumler ?? []).map((a) => a.id as string);
  const fotoSay = new Map<string, number>();
  if (albumIds.length) {
    const { data: foto } = await admin
      .from("album_fotograflar")
      .select("album_id")
      .in("album_id", albumIds);
    for (const f of foto ?? [])
      fotoSay.set(f.album_id as string, (fotoSay.get(f.album_id as string) ?? 0) + 1);
  }

  return liste.map((o) => {
    const a = albumMap.get(o.id as string);
    return {
      event_id: o.id as string,
      event_title: o.title as string,
      customer_name: (o.customer_name as string) ?? null,
      analiz_edilen: analizSay.get(o.id as string) ?? 0,
      album_id: (a?.id as string) ?? null,
      durum: (a?.durum as string) ?? null,
      slug: (a?.slug as string) ?? null,
      foto_sayisi: a ? (fotoSay.get(a.id as string) ?? 0) : 0,
    };
  });
}

// ---- Oluştur (admin tetikler; otomatik DEĞİL) ----
export async function albumOlustur(
  eventId: string,
  paket: string,
  ozelAdet?: number | null,
): Promise<{ ok: boolean; id?: string; mevcut?: boolean; hata?: string }> {
  const admin = createAdminClient();

  // Etkinlikte zaten albüm varsa onu döndür (üzerine yazma).
  const { data: varOlan } = await admin
    .from("albumler")
    .select("id")
    .eq("event_id", eventId)
    .maybeSingle();
  if (varOlan) return { ok: true, id: varOlan.id as string, mevcut: true };

  const analiz = await analizHamListe(eventId);
  if (analiz.length === 0) {
    return { ok: false, hata: "Önce AI Medya Merkezi'nde fotoğrafları analiz edin." };
  }

  const limit = paketAdet(paket, ozelAdet);
  const secim = albumSec(analiz, limit);
  if (secim.length === 0) return { ok: false, hata: "Seçilebilecek uygun fotoğraf yok." };

  const bilgi = await odaBilgiId(eventId);
  const { data: album, error } = await admin
    .from("albumler")
    .insert({
      event_id: eventId,
      baslik: `${bilgi?.title ?? "Düğün"} Albümü`,
      paket,
      limit_adet: limit,
      kapak_media_id: secim[0]?.media_id ?? null,
      durum: "taslak",
    })
    .select("id")
    .single();
  if (error || !album) return { ok: false, hata: "Albüm oluşturulamadı." };

  const albumId = album.id as string;
  const satirlar = secim.map((s) => ({
    album_id: albumId,
    media_id: s.media_id,
    bolum: s.bolum,
    sira: s.sira,
  }));
  const { error: fErr } = await admin.from("album_fotograflar").insert(satirlar);
  if (fErr) return { ok: false, hata: "Fotoğraflar eklenemedi." };

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

// ---- Admin editör ----
export async function albumGetir(id: string): Promise<Album | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("albumler")
    .select("*, events(title)")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;

  const { data: foto } = await admin
    .from("album_fotograflar")
    .select("media_id, bolum, sira, media(storage_path)")
    .eq("album_id", id)
    .order("sira", { ascending: true });
  const satirlar = foto ?? [];
  const harita = await imzaliUrlHaritasi(
    satirlar.map((f) => (f as { media?: { storage_path?: string } }).media?.storage_path ?? ""),
  );
  const fotograflar: AlbumFoto[] = satirlar.map((f) => {
    const path = (f as { media?: { storage_path?: string } }).media?.storage_path ?? "";
    return {
      media_id: f.media_id as string,
      url: harita.get(path) ?? null,
      bolum: (f.bolum as string) ?? null,
      sira: (f.sira as number) ?? 0,
    };
  });

  const ev = (data as { events?: { title?: string } }).events;
  return satirCevir(data, ev?.title ?? "Oda", fotograflar);
}

// Albümde olmayan, analiz edilmiş fotoğraflar (ekleme havuzu).
export async function albumHavuz(
  eventId: string,
  haricMediaIds: string[],
): Promise<AnalizFoto[]> {
  const tum = await analizListesi(eventId);
  const haric = new Set(haricMediaIds);
  return tum.filter((f) => !haric.has(f.id));
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

  // Foto setini yeniden yaz (basit ve güvenli).
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

  const { data: foto } = await admin
    .from("album_fotograflar")
    .select("media_id, bolum, sira, media(storage_path)")
    .eq("album_id", data.id as string)
    .order("sira", { ascending: true });
  const satirlar = foto ?? [];
  const harita = await imzaliUrlHaritasi(
    satirlar.map((f) => (f as { media?: { storage_path?: string } }).media?.storage_path ?? ""),
  );
  const fotograflar: AlbumFoto[] = satirlar.map((f) => {
    const path = (f as { media?: { storage_path?: string } }).media?.storage_path ?? "";
    return {
      media_id: f.media_id as string,
      url: harita.get(path) ?? null,
      bolum: (f.bolum as string) ?? null,
      sira: (f.sira as number) ?? 0,
    };
  });
  const ev = (data as { events?: { title?: string } }).events;
  return satirCevir(data, ev?.title ?? "", fotograflar);
}
