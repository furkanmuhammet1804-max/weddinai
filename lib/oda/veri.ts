// =============================================================
// ODA VERİSİ — sunucu tarafı okuma/yazma yardımcıları (service-role).
// Buradaki her fonksiyon eventId/slug ile SINIRLI çalışır; çağıran rota
// önce oda oturumunu (oturum.ts) doğrulamalıdır.
//
// Depolama düzeni (0001/0002):
//   event-media  → foto/video, path: "<event_id>/..."
//   event-audio  → sesli anı,  path: "<event_id>/..."
// Bucket'lar PRIVATE → erişim imzalı URL ile.
// =============================================================
import { createAdminClient } from "@/lib/supabase/admin";

const MEDYA_BUCKET = "event-media";
const SES_BUCKET = "event-audio";
const IMZA_OMUR_SN = 60 * 60; // 1 saat

export type FotoVideo = "fotograf" | "video";

export interface OdaBilgi {
  id: string;
  title: string;
  slug: string;
  event_type: string;
  event_date: string | null;
  status: string;
  expires_at?: string | null;
}

export interface OdaMedya {
  id: string;
  url: string | null;
  file_type: FotoVideo;
  guest_name: string | null;
  showroom_approved: boolean;
  showroom_requested: boolean;
  is_favorite: boolean;
  album_aday: boolean;
  status: string;
  created_at: string;
}

export interface OdaAni {
  id: string;
  guest_name: string | null;
  message_text: string | null;
  audio_url: string | null;
  created_at: string;
}

// Bir bucket için path → imzalı URL eşlemesi (toplu, verimli).
async function imzaliUrlHaritasi(
  bucket: string,
  paths: string[],
): Promise<Map<string, string>> {
  const harita = new Map<string, string>();
  const temiz = paths.filter((p) => !!p);
  if (temiz.length === 0) return harita;
  const admin = createAdminClient();
  const { data } = await admin.storage
    .from(bucket)
    .createSignedUrls(temiz, IMZA_OMUR_SN);
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) harita.set(item.path, item.signedUrl);
  }
  return harita;
}

export async function odaBilgiId(eventId: string): Promise<OdaBilgi | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("events")
    .select("id, title, slug, event_type, event_date, status, expires_at")
    .eq("id", eventId)
    .maybeSingle();
  return (data as OdaBilgi) ?? null;
}

// Oda hâlâ müşteriye açık mı? (aktif + süresi dolmamış)
export function odaAcikMi(bilgi: OdaBilgi | null): boolean {
  if (!bilgi) return false;
  if (bilgi.status !== "aktif") return false;
  if (bilgi.expires_at && new Date(bilgi.expires_at).getTime() <= Date.now())
    return false;
  return true;
}

export async function odaMedyalari(eventId: string): Promise<OdaMedya[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("media")
    .select(
      "id, storage_path, file_type, guest_name, showroom_approved, showroom_requested, is_favorite, album_aday, status, created_at",
    )
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  const satirlar = data ?? [];
  const harita = await imzaliUrlHaritasi(
    MEDYA_BUCKET,
    satirlar.map((m) => m.storage_path as string),
  );
  return satirlar.map((m) => ({
    id: m.id as string,
    url: harita.get(m.storage_path as string) ?? null,
    file_type: m.file_type as FotoVideo,
    guest_name: (m.guest_name as string) ?? null,
    showroom_approved: !!m.showroom_approved,
    showroom_requested: !!m.showroom_requested,
    is_favorite: !!m.is_favorite,
    album_aday: !!m.album_aday,
    status: m.status as string,
    created_at: m.created_at as string,
  }));
}

export async function odaAnilari(eventId: string): Promise<OdaAni[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("guestbook")
    .select("id, guest_name, message_text, audio_storage_path, created_at")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  const satirlar = data ?? [];
  const harita = await imzaliUrlHaritasi(
    SES_BUCKET,
    satirlar
      .map((a) => a.audio_storage_path as string | null)
      .filter((p): p is string => !!p),
  );
  return satirlar.map((a) => ({
    id: a.id as string,
    guest_name: (a.guest_name as string) ?? null,
    message_text: (a.message_text as string) ?? null,
    audio_url: a.audio_storage_path
      ? (harita.get(a.audio_storage_path as string) ?? null)
      : null,
    created_at: a.created_at as string,
  }));
}

// Müşteri bir fotoğrafı showroom'a GÖNDERİR / geri çeker (admin onayı bekler).
// eventId ile sınırlıdır → müşteri yalnızca KENDİ odasının medyasını değiştirir.
// Talebi geri çekince admin onayı da düşer (vitrinden çıkar).
export async function showroomTalepDegistir(
  eventId: string,
  mediaId: string,
  talep: boolean,
): Promise<boolean> {
  const admin = createAdminClient();
  const yama = talep
    ? { showroom_requested: true }
    : { showroom_requested: false, showroom_approved: false };
  const { error } = await admin
    .from("media")
    .update(yama)
    .eq("id", mediaId)
    .eq("event_id", eventId); // güvenlik: yalnızca bu odaya ait satır
  return !error;
}

// Müşteri bir içeriği favorilere ekler/çıkarır (kendi odasıyla sınırlı).
export async function favoriDegistir(
  eventId: string,
  mediaId: string,
  favori: boolean,
): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("media")
    .update({ is_favorite: favori })
    .eq("id", mediaId)
    .eq("event_id", eventId);
  return !error;
}

// Müşteri bir fotoğrafı "albüme aday" işaretler/kaldırır (kendi odasıyla sınırlı).
// Albümü yine YALNIZCA admin kurar; bu yalnızca adminin gördüğü bir öneridir.
export async function albumAdayDegistir(
  eventId: string,
  mediaId: string,
  aday: boolean,
): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("media")
    .update({ album_aday: aday })
    .eq("id", mediaId)
    .eq("event_id", eventId);
  return !error;
}

export interface SlaytFoto {
  id: string;
  url: string;
  guest_name: string | null;
}

// Canlı slayt: aktif etkinliğin YAYINLANMIŞ (onaylandi) tüm fotoğrafları,
// kronolojik (eskiden yeniye → yeni gelen sona eklenir). Düğün ekranı için.
export async function slaytVerisi(
  slug: string,
): Promise<{ bilgi: OdaBilgi; fotograflar: SlaytFoto[] } | null> {
  const admin = createAdminClient();
  const { data: ev } = await admin
    .from("events")
    .select("id, title, slug, event_type, event_date, status")
    .ilike("slug", slug)
    .eq("status", "aktif")
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .maybeSingle();
  if (!ev) return null;

  const { data: medya } = await admin
    .from("media")
    .select("id, storage_path, guest_name")
    .eq("event_id", ev.id)
    .eq("file_type", "fotograf")
    .eq("status", "onaylandi")
    .order("created_at", { ascending: true });
  const satirlar = medya ?? [];
  const harita = await imzaliUrlHaritasi(
    MEDYA_BUCKET,
    satirlar.map((m) => m.storage_path as string),
  );
  const fotograflar = satirlar
    .map((m) => ({
      id: m.id as string,
      url: harita.get(m.storage_path as string) ?? "",
      guest_name: (m.guest_name as string) ?? null,
    }))
    .filter((f) => f.url);

  return { bilgi: ev as OdaBilgi, fotograflar };
}

// Herkese açık showroom: yalnızca onaylanmış FOTOĞRAFLAR + aktif etkinlik.
export async function showroomVerisi(
  slug: string,
): Promise<{ bilgi: OdaBilgi; fotograflar: { id: string; url: string }[] } | null> {
  const admin = createAdminClient();
  const { data: ev } = await admin
    .from("events")
    .select("id, title, slug, event_type, event_date, status")
    .ilike("slug", slug)
    .eq("status", "aktif")
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .maybeSingle();
  if (!ev) return null;

  const { data: medya } = await admin
    .from("media")
    .select("id, storage_path")
    .eq("event_id", ev.id)
    .eq("showroom_approved", true)
    .neq("status", "reddedildi")
    .eq("file_type", "fotograf")
    .order("created_at", { ascending: false });
  const satirlar = medya ?? [];
  const harita = await imzaliUrlHaritasi(
    MEDYA_BUCKET,
    satirlar.map((m) => m.storage_path as string),
  );
  const fotograflar = satirlar
    .map((m) => ({
      id: m.id as string,
      url: harita.get(m.storage_path as string) ?? "",
    }))
    .filter((f) => f.url);

  return { bilgi: ev as OdaBilgi, fotograflar };
}

// =============================================================
// GENEL SHOWROOM — tüm aktif/süresi dolmamış odaların admin onaylı
// fotoğrafları (herkese açık vitrin, ana sayfadan erişilir).
// =============================================================
export interface GenelVitrinFoto {
  id: string;
  url: string;
  event_title: string;
  slug: string;
}

export async function showroomGenelVerisi(
  limit = 60,
): Promise<GenelVitrinFoto[]> {
  const admin = createAdminClient();
  // Önce aktif + süresi dolmamış oda id'leri.
  const { data: odalar } = await admin
    .from("events")
    .select("id, title, slug")
    .eq("status", "aktif")
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);
  const odaMap = new Map(
    (odalar ?? []).map((o) => [
      o.id as string,
      { title: o.title as string, slug: o.slug as string },
    ]),
  );
  if (odaMap.size === 0) return [];

  const { data: medya } = await admin
    .from("media")
    .select("id, storage_path, event_id")
    .in("event_id", [...odaMap.keys()])
    .eq("showroom_approved", true)
    .neq("status", "reddedildi")
    .eq("file_type", "fotograf")
    .order("created_at", { ascending: false })
    .limit(limit);
  const satirlar = medya ?? [];
  const harita = await imzaliUrlHaritasi(
    MEDYA_BUCKET,
    satirlar.map((m) => m.storage_path as string),
  );
  return satirlar
    .map((m) => {
      const oda = odaMap.get(m.event_id as string);
      return {
        id: m.id as string,
        url: harita.get(m.storage_path as string) ?? "",
        event_title: oda?.title ?? "",
        slug: oda?.slug ?? "",
      };
    })
    .filter((f) => f.url);
}

// =============================================================
// YÖNETİCİ (ADMIN) tarafı — service_role ile, RLS bypass.
// =============================================================

export interface AdminOdaOzet {
  id: string;
  title: string;
  customer_name: string | null;
  event_type: string;
  event_date: string | null;
  slug: string;
  status: string;
  created_at: string;
  expires_at: string | null;
  medya_sayi: number;
  bekleyen_onay: number;
}

// Süresi dolmasına kalan gün (negatifse 0). null = sınırsız.
export function kalanGun(expires_at: string | null | undefined): number | null {
  if (!expires_at) return null;
  const ms = new Date(expires_at).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export async function adminOdalar(): Promise<AdminOdaOzet[]> {
  const admin = createAdminClient();
  const { data: odalar } = await admin
    .from("events")
    .select(
      "id, title, customer_name, event_type, event_date, slug, status, created_at, expires_at",
    )
    .order("created_at", { ascending: false });
  const liste = odalar ?? [];
  if (liste.length === 0) return [];

  const { data: medyalar } = await admin
    .from("media")
    .select("event_id, showroom_requested, showroom_approved");
  const sayim = new Map<string, { toplam: number; bekleyen: number }>();
  for (const m of medyalar ?? []) {
    const k = m.event_id as string;
    const v = sayim.get(k) ?? { toplam: 0, bekleyen: 0 };
    v.toplam += 1;
    if (m.showroom_requested && !m.showroom_approved) v.bekleyen += 1;
    sayim.set(k, v);
  }

  return liste.map((o) => {
    const v = sayim.get(o.id as string) ?? { toplam: 0, bekleyen: 0 };
    return {
      id: o.id as string,
      title: o.title as string,
      customer_name: (o.customer_name as string) ?? null,
      event_type: o.event_type as string,
      event_date: (o.event_date as string) ?? null,
      slug: o.slug as string,
      status: o.status as string,
      created_at: o.created_at as string,
      expires_at: (o.expires_at as string) ?? null,
      medya_sayi: v.toplam,
      bekleyen_onay: v.bekleyen,
    };
  });
}

export interface OnayBekleyen {
  id: string;
  url: string | null;
  file_type: FotoVideo;
  guest_name: string | null;
  event_id: string;
  event_title: string;
  slug: string;
  created_at: string;
}

// Tüm odalardaki, müşterinin gönderdiği ama admin'in onaylamadığı içerikler.
export async function onayKuyrugu(): Promise<OnayBekleyen[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("media")
    .select(
      "id, storage_path, file_type, guest_name, event_id, created_at, events(title, slug)",
    )
    .eq("showroom_requested", true)
    .eq("showroom_approved", false)
    .order("created_at", { ascending: false });
  const satirlar = data ?? [];
  const harita = await imzaliUrlHaritasi(
    MEDYA_BUCKET,
    satirlar.map((m) => m.storage_path as string),
  );
  return satirlar.map((m) => {
    const ev = (m as { events?: { title?: string; slug?: string } }).events;
    return {
      id: m.id as string,
      url: harita.get(m.storage_path as string) ?? null,
      file_type: m.file_type as FotoVideo,
      guest_name: (m.guest_name as string) ?? null,
      event_id: m.event_id as string,
      event_title: ev?.title ?? "Oda",
      slug: ev?.slug ?? "",
      created_at: m.created_at as string,
    };
  });
}

// Admin bir içeriği vitrine onaylar (true) veya reddeder (false → talebi düşür).
export async function adminOnayDegistir(
  mediaId: string,
  onay: boolean,
): Promise<boolean> {
  const admin = createAdminClient();
  const yama = onay
    ? { showroom_approved: true }
    : { showroom_approved: false, showroom_requested: false };
  const { error } = await admin.from("media").update(yama).eq("id", mediaId);
  return !error;
}

export interface AdminIstatistik {
  oda: number;
  aktifOda: number;
  medya: number;
  ani: number;
  bekleyenOnay: number;
  vitrindeki: number;
}

export async function adminIstatistik(): Promise<AdminIstatistik> {
  const admin = createAdminClient();
  const [oda, aktif, medya, ani, bekleyen, vitrin] = await Promise.all([
    admin.from("events").select("id", { count: "exact", head: true }),
    admin
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("status", "aktif"),
    admin.from("media").select("id", { count: "exact", head: true }),
    admin.from("guestbook").select("id", { count: "exact", head: true }),
    admin
      .from("media")
      .select("id", { count: "exact", head: true })
      .eq("showroom_requested", true)
      .eq("showroom_approved", false),
    admin
      .from("media")
      .select("id", { count: "exact", head: true })
      .eq("showroom_approved", true),
  ]);
  return {
    oda: oda.count ?? 0,
    aktifOda: aktif.count ?? 0,
    medya: medya.count ?? 0,
    ani: ani.count ?? 0,
    bekleyenOnay: bekleyen.count ?? 0,
    vitrindeki: vitrin.count ?? 0,
  };
}
