// =============================================================
// DİJİTAL DAVETİYE — sunucu tarafı veri yardımcıları (service-role).
// Public form/RSVP insert'leri buradan (anon'a tablo erişimi yok).
// =============================================================
import { createAdminClient } from "@/lib/supabase/admin";
import { slugYap, kisaEk } from "@/lib/slug";

const BUCKET = "davetiye-media";

export type DavetiyeDurum =
  | "talep_alindi"
  | "odeme_bekleniyor"
  | "odeme_onaylandi"
  | "tasarim_hazirlaniyor"
  | "musteri_onayi"
  | "yayinda"
  | "tamamlandi"
  | "iptal";

// Sıra + etiket + rozet rengi (admin paneli).
export const DAVETIYE_DURUMLAR: {
  id: DavetiyeDurum;
  etiket: string;
  renk: string;
}[] = [
  { id: "talep_alindi", etiket: "Talep Alındı", renk: "bg-muted text-foreground/70" },
  { id: "odeme_bekleniyor", etiket: "Ödeme Bekleniyor", renk: "bg-amber-100 text-amber-700" },
  { id: "odeme_onaylandi", etiket: "Ödeme Onaylandı", renk: "bg-sky-100 text-sky-700" },
  { id: "tasarim_hazirlaniyor", etiket: "Tasarım Hazırlanıyor", renk: "bg-violet-100 text-violet-700" },
  { id: "musteri_onayi", etiket: "Müşteri Onayı Bekleniyor", renk: "bg-orange-100 text-orange-700" },
  { id: "yayinda", etiket: "Yayında", renk: "bg-emerald-100 text-emerald-700" },
  { id: "tamamlandi", etiket: "Tamamlandı", renk: "bg-primary-soft text-primary-deep" },
  { id: "iptal", etiket: "İptal", renk: "bg-rose-soft text-rose" },
];

export function durumEtiket(d: string): string {
  return DAVETIYE_DURUMLAR.find((x) => x.id === d)?.etiket ?? d;
}

export interface DavetiyeGirdi {
  gelin_ad: string;
  damat_ad: string;
  phone?: string | null;
  email?: string | null;
  kina_tarih?: string | null;
  kina_saat?: string | null;
  kina_mekan?: string | null;
  kina_adres?: string | null;
  kina_maps?: string | null;
  dugun_tarih?: string | null;
  dugun_saat?: string | null;
  dugun_mekan?: string | null;
  dugun_adres?: string | null;
  dugun_maps?: string | null;
  mesaj?: string | null;
  notlar?: string | null;
  muzik_youtube?: string | null;
}

export interface Davetiye extends DavetiyeGirdi {
  id: string;
  slug: string | null;
  durum: DavetiyeDurum;
  gelin_foto: string | null;
  damat_foto: string | null;
  foto_paths: string[];
  muzik_path: string | null;
  created_at: string;
  published_at: string | null;
}

export interface DavetiyeRSVP {
  id: string;
  ad: string;
  katilim: "evet" | "hayir";
  kisi_sayisi: number;
  not_mesaj: string | null;
  created_at: string;
}

export function medyaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const admin = createAdminClient();
  return admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

// Talep oluştur → id döner (medya sonra eklenir).
export async function davetiyeOlustur(g: DavetiyeGirdi): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("davetiyeler")
    .insert({ ...g, durum: "talep_alindi" })
    .select("id")
    .single();
  if (error) {
    console.error("[davetiye] olustur hata", error.message);
    return null;
  }
  return data.id as string;
}

// Yüklenen materyalleri kayda bağla (yalnızca o kayıt).
export async function davetiyeMedyaGuncelle(
  id: string,
  medya: { gelin_foto?: string; damat_foto?: string; foto_paths?: string[]; muzik_path?: string },
): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin.from("davetiyeler").update(medya).eq("id", id);
  if (error) console.error("[davetiye] medya guncelle hata", error.message);
  return !error;
}

export async function davetiyeListe(): Promise<Davetiye[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("davetiyeler")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []) as Davetiye[];
}

export async function davetiyeGetir(id: string): Promise<Davetiye | null> {
  const admin = createAdminClient();
  const { data } = await admin.from("davetiyeler").select("*").eq("id", id).maybeSingle();
  return (data as Davetiye) ?? null;
}

// Public yayın sayfası: yalnızca "yayinda" durumundaki davetiye.
export async function davetiyeGetirSlug(slug: string): Promise<Davetiye | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("davetiyeler")
    .select("*")
    .ilike("slug", slug)
    .eq("durum", "yayinda")
    .maybeSingle();
  return (data as Davetiye) ?? null;
}

// Durum güncelle. "yayinda"ya geçerken slug yoksa otomatik üret.
export async function davetiyeDurumGuncelle(
  id: string,
  durum: DavetiyeDurum,
): Promise<{ ok: boolean; slug?: string }> {
  const admin = createAdminClient();
  const yama: Record<string, unknown> = { durum };

  if (durum === "yayinda") {
    const mevcut = await davetiyeGetir(id);
    if (!mevcut) return { ok: false };
    let slug = mevcut.slug;
    if (!slug) {
      const taban =
        slugYap(`${mevcut.gelin_ad}-${mevcut.damat_ad}`) || "davetiye";
      // Benzersizlik: çakışırsa kısa ek.
      slug = taban;
      for (let deneme = 0; deneme < 5; deneme++) {
        const { data: var_mi } = await admin
          .from("davetiyeler")
          .select("id")
          .ilike("slug", slug)
          .neq("id", id)
          .maybeSingle();
        if (!var_mi) break;
        slug = `${taban}-${kisaEk()}`;
      }
      yama.slug = slug;
    }
    yama.published_at = new Date().toISOString();
    const { error } = await admin.from("davetiyeler").update(yama).eq("id", id);
    return error ? { ok: false } : { ok: true, slug: slug ?? undefined };
  }

  const { error } = await admin.from("davetiyeler").update(yama).eq("id", id);
  return { ok: !error };
}

export async function rsvpEkle(
  davetiyeId: string,
  ad: string,
  katilim: "evet" | "hayir",
  kisiSayisi: number,
  not: string | null,
): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin.from("davetiye_rsvp").insert({
    davetiye_id: davetiyeId,
    ad,
    katilim,
    kisi_sayisi: Math.max(1, Math.min(20, kisiSayisi || 1)),
    not_mesaj: not,
  });
  if (error) console.error("[davetiye] rsvp hata", error.message);
  return !error;
}

export async function rsvpListe(davetiyeId: string): Promise<DavetiyeRSVP[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("davetiye_rsvp")
    .select("id, ad, katilim, kisi_sayisi, not_mesaj, created_at")
    .eq("davetiye_id", davetiyeId)
    .order("created_at", { ascending: false });
  return (data ?? []) as DavetiyeRSVP[];
}
