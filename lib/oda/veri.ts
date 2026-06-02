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
}

export interface OdaMedya {
  id: string;
  url: string | null;
  file_type: FotoVideo;
  guest_name: string | null;
  showroom_approved: boolean;
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
    .select("id, title, slug, event_type, event_date, status")
    .eq("id", eventId)
    .maybeSingle();
  return (data as OdaBilgi) ?? null;
}

export async function odaMedyalari(eventId: string): Promise<OdaMedya[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("media")
    .select("id, storage_path, file_type, guest_name, showroom_approved, status, created_at")
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

// Müşteri bir fotoğrafı showroom'da yayınlar/geri çeker. eventId ile
// sınırlıdır → müşteri yalnızca KENDİ odasının medyasını değiştirir.
export async function showroomOnayDegistir(
  eventId: string,
  mediaId: string,
  onay: boolean,
): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("media")
    .update({ showroom_approved: onay })
    .eq("id", mediaId)
    .eq("event_id", eventId); // güvenlik: yalnızca bu odaya ait satır
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
    .maybeSingle();
  if (!ev) return null;

  const { data: medya } = await admin
    .from("media")
    .select("id, storage_path")
    .eq("event_id", ev.id)
    .eq("showroom_approved", true)
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
