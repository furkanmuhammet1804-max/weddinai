// =============================================================
// AI MEDYA MERKEZİ VERİSİ — sunucu tarafı (service-role). (Özellik 4 revizyonu)
//
// Misafir yüklediği anda fotoğraf SUNUCUDA LOKAL yüz tespitiyle kategorilenir:
//   tekli (0–1 yüz) · toplu (2+ yüz) · video (dosya türü). Sonuç media tablosuna
//   yazılır (medya_kategori). Admin override edebilir. Gemini Vision yok.
//
// GÜVENLİK (§6): yüz tespiti biyometrik işleme sayıldığı için fotoğraflar
// YALNIZCA events.ai_medya_onay = true (KVKK) ise işlenir. Onay yoksa videolar
// 'video' etiketlenir, fotoğraflar kategorisiz "onay bekliyor" kalır.
// =============================================================
import { createAdminClient } from "@/lib/supabase/admin";
import { yuzTespit } from "@/lib/medya/yuz";

const MEDYA_BUCKET = "event-media";
const IMZA_OMUR_SN = 60 * 60;

// ---- Tipler ----
export interface MedyaMerkeziSatir {
  event_id: string;
  event_title: string;
  customer_name: string | null;
  toplam: number;
  kategorilenen: number;
  bekleyen: number;
  ai_medya_onay: boolean;
  ai_onay_token: string | null;
}

export interface MedyaFoto {
  id: string;
  url: string | null;
  file_type: "fotograf" | "video";
  kategori: string | null;
  kategori_kaynak: string | null;
  yuz_sayisi: number | null;
  oto_islendi: boolean;
  guest_name: string | null;
  created_at: string;
}

export interface KategoriDurum {
  toplam: number;
  kategorilenen: number;
  bekleyen: number; // oto_islendi = false
  tekli: number;
  toplu: number;
  video: number;
  ai_medya_onay: boolean;
}

// ---- Admin liste (oda başına özet) ----
export async function medyaMerkeziListe(): Promise<MedyaMerkeziSatir[]> {
  const admin = createAdminClient();
  const { data: odalar } = await admin
    .from("events")
    .select("id, title, customer_name, ai_medya_onay, ai_onay_token, created_at")
    .order("created_at", { ascending: false });
  const liste = odalar ?? [];
  if (liste.length === 0) return [];
  const ids = liste.map((o) => o.id as string);

  const { data: medyalar } = await admin
    .from("media")
    .select("event_id, medya_kategori, oto_islendi")
    .in("event_id", ids);

  const sayim = new Map<string, { toplam: number; kategorilenen: number; bekleyen: number }>();
  for (const m of medyalar ?? []) {
    const k = m.event_id as string;
    const v = sayim.get(k) ?? { toplam: 0, kategorilenen: 0, bekleyen: 0 };
    v.toplam += 1;
    if (m.medya_kategori) v.kategorilenen += 1;
    if (!m.oto_islendi) v.bekleyen += 1;
    sayim.set(k, v);
  }

  return liste.map((o) => {
    const v = sayim.get(o.id as string) ?? { toplam: 0, kategorilenen: 0, bekleyen: 0 };
    return {
      event_id: o.id as string,
      event_title: o.title as string,
      customer_name: (o.customer_name as string) ?? null,
      toplam: v.toplam,
      kategorilenen: v.kategorilenen,
      bekleyen: v.bekleyen,
      ai_medya_onay: !!o.ai_medya_onay,
      ai_onay_token: (o.ai_onay_token as string) ?? null,
    };
  });
}

// ---- KVKK onay durumu (sadece okuma; yazma lib/kvkk/onay.ts'te) ----
export async function etkinlikOnayDurum(eventId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("events")
    .select("ai_medya_onay")
    .eq("id", eventId)
    .maybeSingle();
  return !!data?.ai_medya_onay;
}

// Admin elle onay aç/kapat (müşteri /ai-onay akışına ek; admin de yapabilir).
export async function etkinlikOnayBelirle(eventId: string, onay: boolean): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("events")
    .update({
      ai_medya_onay: onay,
      ai_medya_onay_at: onay ? new Date().toISOString() : null,
    })
    .eq("id", eventId);
  if (!error && onay) await onaySonrasiKuyrugaAl(eventId);
  return !error;
}

// Onay verildikten SONRA: onaydan önce yüklenmiş (oto_islendi=true ama
// kategorisiz, admin override edilmemiş) fotoğrafları yeniden kuyruğa al ki
// admin "Bekleyenleri Kategorile" ile bunları işleyebilsin. Videolar zaten
// kategorili olduğundan etkilenmez.
export async function onaySonrasiKuyrugaAl(eventId: string): Promise<void> {
  const admin = createAdminClient();
  // Yalnızca kategorisiz fotoğraflar; admin'in kategori atadıkları zaten
  // (medya_kategori dolu olduğundan) bu filtreye girmez ve korunur.
  await admin
    .from("media")
    .update({ oto_islendi: false })
    .eq("event_id", eventId)
    .eq("file_type", "fotograf")
    .is("medya_kategori", null);
}

// ---- Kategori durumu (ilerleme + dağılım) ----
export async function kategoriDurum(eventId: string): Promise<KategoriDurum> {
  const admin = createAdminClient();
  const [{ data: medyalar }, onay] = await Promise.all([
    admin.from("media").select("medya_kategori, oto_islendi").eq("event_id", eventId),
    etkinlikOnayDurum(eventId),
  ]);
  const rows = medyalar ?? [];
  let kategorilenen = 0, bekleyen = 0, tekli = 0, toplu = 0, video = 0;
  for (const m of rows) {
    if (m.medya_kategori) kategorilenen += 1;
    if (!m.oto_islendi) bekleyen += 1;
    if (m.medya_kategori === "tekli") tekli += 1;
    else if (m.medya_kategori === "toplu") toplu += 1;
    else if (m.medya_kategori === "video") video += 1;
  }
  return { toplam: rows.length, kategorilenen, bekleyen, tekli, toplu, video, ai_medya_onay: onay };
}

// ---- İşlenecek (oto_islendi=false) medyalar ----
export interface BekleyenMedya {
  id: string;
  storage_path: string;
  file_type: "fotograf" | "video";
}
export async function bekleyenMedyalar(eventId: string, limit: number): Promise<BekleyenMedya[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("media")
    .select("id, storage_path, file_type")
    .eq("event_id", eventId)
    .eq("oto_islendi", false)
    .order("created_at", { ascending: true })
    .limit(limit);
  return (data ?? []).map((m) => ({
    id: m.id as string,
    storage_path: m.storage_path as string,
    file_type: m.file_type as "fotograf" | "video",
  }));
}

async function medyaBaytlari(storagePath: string): Promise<Buffer | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(MEDYA_BUCKET).download(storagePath);
  if (error || !data) return null;
  return Buffer.from(await data.arrayBuffer());
}

// ---- Otomatik kategori uygula (TEK medya) ----
// Hem public misafir-tetikli uç hem admin parti işlemesi bunu kullanır.
// Admin override (kaynak='admin') edilmiş medyaya DOKUNMAZ.
export interface OtoSonuc {
  ok: boolean;
  kategori: string | null;
  beklemede?: boolean; // KVKK onayı yok → foto kategorilenmedi
  zatenIslendi?: boolean;
}
export async function otoKategoriUygula(mediaId: string): Promise<OtoSonuc> {
  const admin = createAdminClient();
  const { data: m } = await admin
    .from("media")
    .select("id, event_id, file_type, storage_path, medya_kategori_kaynak, oto_islendi")
    .eq("id", mediaId)
    .maybeSingle();
  if (!m) return { ok: false, kategori: null };

  // Admin elle ayarladıysa otomatik işlem ezmez.
  if (m.medya_kategori_kaynak === "admin") {
    return { ok: true, kategori: null, zatenIslendi: true };
  }

  const simdi = new Date().toISOString();

  // Video → her zaman 'video' (KVKK onayı gerekmez; yüz işlenmez).
  if (m.file_type === "video") {
    await admin
      .from("media")
      .update({
        medya_kategori: "video",
        medya_kategori_kaynak: "oto",
        yuz_sayisi: null,
        oto_islendi: true,
        oto_islendi_at: simdi,
      })
      .eq("id", mediaId);
    return { ok: true, kategori: "video" };
  }

  // Foto → KVKK onayı yoksa kategorilemeden "işlendi" işaretle (yüz işlenmez).
  const onay = await etkinlikOnayDurum(m.event_id as string);
  if (!onay) {
    await admin
      .from("media")
      .update({ oto_islendi: true, oto_islendi_at: simdi })
      .eq("id", mediaId);
    return { ok: true, kategori: null, beklemede: true };
  }

  // Onaylı → lokal yüz tespiti.
  const buf = await medyaBaytlari(m.storage_path as string);
  let kategori: string | null = null;
  let yuz: number | null = null;
  if (buf) {
    const sonuc = await yuzTespit(buf);
    if (sonuc) {
      kategori = sonuc.kategori; // 'tekli' | 'toplu'
      yuz = sonuc.yuzSayisi;
    }
  }
  await admin
    .from("media")
    .update({
      medya_kategori: kategori, // tespit başarısızsa null kalır (admin override edebilir)
      medya_kategori_kaynak: kategori ? "oto" : null,
      yuz_sayisi: yuz,
      oto_islendi: true,
      oto_islendi_at: simdi,
    })
    .eq("id", mediaId);
  return { ok: true, kategori };
}

// ---- Admin override ----
export async function kategoriDegistir(mediaId: string, kategori: string | null): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("media")
    .update({
      medya_kategori: kategori,
      medya_kategori_kaynak: kategori ? "admin" : null,
      oto_islendi: true,
    })
    .eq("id", mediaId);
  return !error;
}

// ---- Public uç güvenliği: medya bu slug'lı aktif etkinliğe mi ait? ----
export async function medyaSlugDogrula(
  slug: string,
  mediaId: string,
): Promise<boolean> {
  const admin = createAdminClient();
  const { data: ev } = await admin
    .from("events")
    .select("id")
    .ilike("slug", slug)
    .eq("status", "aktif")
    .maybeSingle();
  if (!ev) return false;
  const { data: m } = await admin
    .from("media")
    .select("id")
    .eq("id", mediaId)
    .eq("event_id", ev.id as string)
    .maybeSingle();
  return !!m;
}

// ---- İmzalı URL haritası ----
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

// ---- Admin UI: tam medya listesi (URL'li) ----
export async function medyaListesi(eventId: string): Promise<MedyaFoto[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("media")
    .select(
      "id, storage_path, file_type, medya_kategori, medya_kategori_kaynak, yuz_sayisi, oto_islendi, guest_name, created_at",
    )
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  const rows = data ?? [];
  const harita = await imzaliUrlHaritasi(rows.map((m) => m.storage_path as string));
  return rows.map((m) => ({
    id: m.id as string,
    url: harita.get(m.storage_path as string) ?? null,
    file_type: m.file_type as "fotograf" | "video",
    kategori: (m.medya_kategori as string) ?? null,
    kategori_kaynak: (m.medya_kategori_kaynak as string) ?? null,
    yuz_sayisi: m.yuz_sayisi != null ? Number(m.yuz_sayisi) : null,
    oto_islendi: !!m.oto_islendi,
    guest_name: (m.guest_name as string) ?? null,
    created_at: m.created_at as string,
  }));
}
