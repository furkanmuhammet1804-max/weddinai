// =============================================================
// AI MEDYA MERKEZİ VERİSİ — sunucu tarafı (service-role). (Özellik 4)
// Analiz alanlarının okunması/yazılması + KVKK onay yönetimi.
// =============================================================
import { createAdminClient } from "@/lib/supabase/admin";
import { hammingHex, YINELENEN_ESIK, BENZER_ESIK } from "@/lib/medya/analiz";

const MEDYA_BUCKET = "event-media";
const IMZA_OMUR_SN = 60 * 60;

export interface MedyaMerkeziSatir {
  event_id: string;
  event_title: string;
  customer_name: string | null;
  foto_sayisi: number;
  analiz_edilen: number;
  ai_medya_onay: boolean;
}

export interface AnalizFoto {
  id: string;
  url: string | null;
  kategori: string | null;
  kategori_kaynak: string | null;
  bulanik: boolean;
  karanlik: boolean;
  kalite_skor: number | null;
  phash: string | null;
  grup_id: number | null; // benzer grup numarası (read-time)
  yinelenen: boolean; // grubunda daha yüksek kaliteli eş var
  created_at: string;
}

export interface AnalizDurum {
  toplam_foto: number;
  analiz_edilen: number;
  kalan: number;
  ai_medya_onay: boolean;
}

// ---- Admin liste ----
export async function medyaMerkeziListe(): Promise<MedyaMerkeziSatir[]> {
  const admin = createAdminClient();
  const { data: odalar } = await admin
    .from("events")
    .select("id, title, customer_name, ai_medya_onay, created_at")
    .order("created_at", { ascending: false });
  const liste = odalar ?? [];
  if (liste.length === 0) return [];
  const ids = liste.map((o) => o.id as string);

  const { data: medyalar } = await admin
    .from("media")
    .select("event_id, ai_analiz_durum")
    .in("event_id", ids)
    .eq("file_type", "fotograf");

  const sayim = new Map<string, { toplam: number; analiz: number }>();
  for (const m of medyalar ?? []) {
    const k = m.event_id as string;
    const v = sayim.get(k) ?? { toplam: 0, analiz: 0 };
    v.toplam += 1;
    if (m.ai_analiz_durum === "analiz_edildi") v.analiz += 1;
    sayim.set(k, v);
  }

  return liste.map((o) => {
    const v = sayim.get(o.id as string) ?? { toplam: 0, analiz: 0 };
    return {
      event_id: o.id as string,
      event_title: o.title as string,
      customer_name: (o.customer_name as string) ?? null,
      foto_sayisi: v.toplam,
      analiz_edilen: v.analiz,
      ai_medya_onay: !!o.ai_medya_onay,
    };
  });
}

// ---- KVKK onayı ----
export async function etkinlikOnayDurum(eventId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("events")
    .select("ai_medya_onay")
    .eq("id", eventId)
    .maybeSingle();
  return !!data?.ai_medya_onay;
}

export async function etkinlikOnayBelirle(
  eventId: string,
  onay: boolean,
): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("events")
    .update({
      ai_medya_onay: onay,
      ai_medya_onay_at: onay ? new Date().toISOString() : null,
    })
    .eq("id", eventId);
  return !error;
}

// ---- Analiz durumu (ilerleme) ----
export async function analizDurum(eventId: string): Promise<AnalizDurum> {
  const admin = createAdminClient();
  const [toplam, analiz, onay] = await Promise.all([
    admin
      .from("media")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("file_type", "fotograf"),
    admin
      .from("media")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("file_type", "fotograf")
      .eq("ai_analiz_durum", "analiz_edildi"),
    etkinlikOnayDurum(eventId),
  ]);
  const t = toplam.count ?? 0;
  const a = analiz.count ?? 0;
  return { toplam_foto: t, analiz_edilen: a, kalan: Math.max(0, t - a), ai_medya_onay: onay };
}

// ---- İşlenecek (henüz analiz edilmemiş) fotoğraflar ----
export interface BekleyenFoto {
  id: string;
  storage_path: string;
}
export async function bekleyenFotograflar(
  eventId: string,
  limit: number,
): Promise<BekleyenFoto[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("media")
    .select("id, storage_path")
    .eq("event_id", eventId)
    .eq("file_type", "fotograf")
    .eq("ai_analiz_durum", "bekliyor")
    .order("created_at", { ascending: true })
    .limit(limit);
  return (data ?? []).map((m) => ({
    id: m.id as string,
    storage_path: m.storage_path as string,
  }));
}

// Bir fotoğrafın storage'dan ham baytlarını indirir (sharp/vision için).
export async function fotoBaytlari(
  storagePath: string,
): Promise<{ buf: Buffer; mime: string } | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(MEDYA_BUCKET)
    .download(storagePath);
  if (error || !data) return null;
  const buf = Buffer.from(await data.arrayBuffer());
  const mime = (data as Blob).type || "image/jpeg";
  return { buf, mime };
}

// ---- Analiz sonucunu kaydet ----
export interface AnalizYama {
  bulanik: boolean;
  karanlik: boolean;
  kaliteSkor: number;
  phash: string;
  kategori?: string | null; // vision sonucu (onay varsa)
}
export async function analizKaydet(mediaId: string, y: AnalizYama): Promise<void> {
  const admin = createAdminClient();
  const yama: Record<string, unknown> = {
    ai_analiz_durum: "analiz_edildi",
    ai_bulanik: y.bulanik,
    ai_karanlik: y.karanlik,
    ai_kalite_skor: y.kaliteSkor,
    ai_phash: y.phash,
    ai_analiz_at: new Date().toISOString(),
  };
  if (y.kategori) {
    yama.ai_kategori = y.kategori;
    yama.ai_kategori_kaynak = "ai";
  }
  await admin.from("media").update(yama).eq("id", mediaId);
}

// Admin kategori override (kaynak='admin' olur; AI yeniden çalışsa bile korunur).
export async function kategoriDegistir(
  mediaId: string,
  kategori: string | null,
): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("media")
    .update({ ai_kategori: kategori, ai_kategori_kaynak: "admin" })
    .eq("id", mediaId);
  return !error;
}

// İmzalı URL haritası.
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

// Ham analiz satırı (F5 seçimi de kullanır — URL'siz hızlı sürüm).
export interface HamAnaliz {
  id: string;
  storage_path: string;
  kategori: string | null;
  kalite_skor: number | null;
  bulanik: boolean;
  karanlik: boolean;
  phash: string | null;
  created_at: string;
}
export async function analizHamListe(eventId: string): Promise<HamAnaliz[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("media")
    .select(
      "id, storage_path, ai_kategori, ai_kalite_skor, ai_bulanik, ai_karanlik, ai_phash, created_at",
    )
    .eq("event_id", eventId)
    .eq("file_type", "fotograf")
    .eq("ai_analiz_durum", "analiz_edildi")
    .order("created_at", { ascending: true });
  return (data ?? []).map((m) => ({
    id: m.id as string,
    storage_path: m.storage_path as string,
    kategori: (m.ai_kategori as string) ?? null,
    kalite_skor: m.ai_kalite_skor != null ? Number(m.ai_kalite_skor) : null,
    bulanik: !!m.ai_bulanik,
    karanlik: !!m.ai_karanlik,
    phash: (m.ai_phash as string) ?? null,
    created_at: m.created_at as string,
  }));
}

// phash'lere göre benzer grupları işaretle. Aynı gruptaki en yüksek kaliteli
// dışındakiler "yinelenen" sayılır. (Hem F4 UI hem F5 eleme için.)
export function gruplaBenzer<T extends { id: string; phash: string | null; kalite_skor: number | null }>(
  liste: T[],
): Map<string, { grup: number; yinelenen: boolean }> {
  const sonuc = new Map<string, { grup: number; yinelenen: boolean }>();
  const gruplar: T[][] = [];
  for (const item of liste) {
    let yerlesti = false;
    for (const g of gruplar) {
      const ornek = g[0];
      const mesafe = hammingHex(item.phash, ornek.phash);
      if (mesafe <= BENZER_ESIK) {
        g.push(item);
        yerlesti = true;
        break;
      }
    }
    if (!yerlesti) gruplar.push([item]);
  }
  gruplar.forEach((g, gi) => {
    // Gruptaki en yüksek kaliteli "ana" foto; diğerleri yinelenen.
    let enIyiId = g[0].id;
    let enIyiSkor = g[0].kalite_skor ?? -1;
    for (const item of g) {
      if ((item.kalite_skor ?? -1) > enIyiSkor) {
        enIyiSkor = item.kalite_skor ?? -1;
        enIyiId = item.id;
      }
    }
    for (const item of g) {
      sonuc.set(item.id, { grup: gi, yinelenen: g.length > 1 && item.id !== enIyiId });
    }
  });
  return sonuc;
}

// Ayrıca kesin yinelenenleri (çok yakın) ayrı işaretlemek istersek:
export function kesinYinelenenMi(a: string | null, b: string | null): boolean {
  return hammingHex(a, b) <= YINELENEN_ESIK;
}

// ---- F4 UI için tam analiz listesi (URL'li + gruplu) ----
export async function analizListesi(eventId: string): Promise<AnalizFoto[]> {
  const ham = await analizHamListe(eventId);
  const harita = await imzaliUrlHaritasi(ham.map((m) => m.storage_path));
  const gruplama = gruplaBenzer(ham);
  // Admin override bilgisini de almak için kaynak alanını ayrı çekiyoruz.
  const admin = createAdminClient();
  const { data: kaynaklar } = await admin
    .from("media")
    .select("id, ai_kategori_kaynak")
    .in(
      "id",
      ham.map((m) => m.id),
    );
  const kaynakMap = new Map(
    (kaynaklar ?? []).map((k) => [k.id as string, (k.ai_kategori_kaynak as string) ?? null]),
  );

  return ham.map((m) => {
    const g = gruplama.get(m.id);
    return {
      id: m.id,
      url: harita.get(m.storage_path) ?? null,
      kategori: m.kategori,
      kategori_kaynak: kaynakMap.get(m.id) ?? null,
      bulanik: m.bulanik,
      karanlik: m.karanlik,
      kalite_skor: m.kalite_skor,
      phash: m.phash,
      grup_id: g?.grup ?? null,
      yinelenen: g?.yinelenen ?? false,
      created_at: m.created_at,
    };
  });
}
