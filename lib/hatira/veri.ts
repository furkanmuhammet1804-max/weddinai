// =============================================================
// HATIRA DEFTERİ VERİSİ — sunucu tarafı (service-role). (Özellik 3)
// Tüm yazma/okuma admin sunucu rotaları üzerinden; içerik AES-256 ile
// şifreli saklanır (lib/guvenlik/sifrele). Otomatik yayın YOKTUR.
// =============================================================
import { createAdminClient } from "@/lib/supabase/admin";
import { sifrele, coz } from "@/lib/guvenlik/sifrele";
import { slugYap, kisaEk } from "@/lib/slug";

export interface HatiraListeSatir {
  event_id: string;
  event_title: string;
  customer_name: string | null;
  mesaj_sayisi: number;
  defter_id: string | null;
  durum: string | null; // 'taslak' | 'yayinda' | null (henüz yok)
  slug: string | null;
}

export interface HatiraDefter {
  id: string;
  event_id: string;
  event_title: string;
  slug: string | null;
  baslik: string;
  icerik: string | null; // ÇÖZÜLMÜŞ düz metin (yalnız sunucuda)
  durum: string;
  kaynak_ozet: Record<string, unknown>;
  published_at: string | null;
  updated_at: string;
}

// Bir etkinliğin AI'ya verilecek misafir mesajları (yalnız yazılı anılar).
export async function etkinlikMesajlari(eventId: string): Promise<string[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("guestbook")
    .select("message_text, created_at")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });
  return (data ?? [])
    .map((g) => (g.message_text as string | null)?.trim() ?? "")
    .filter((m) => m.length > 0);
}

// Admin liste: her oda için mesaj sayısı + defter durumu.
export async function hatiraListe(): Promise<HatiraListeSatir[]> {
  const admin = createAdminClient();
  const { data: odalar } = await admin
    .from("events")
    .select("id, title, customer_name, created_at")
    .order("created_at", { ascending: false });
  const liste = odalar ?? [];
  if (liste.length === 0) return [];

  const ids = liste.map((o) => o.id as string);

  const [{ data: mesajlar }, { data: defterler }] = await Promise.all([
    admin.from("guestbook").select("event_id").in("event_id", ids),
    admin
      .from("hatira_defteri")
      .select("id, event_id, durum, slug")
      .in("event_id", ids),
  ]);

  const sayim = new Map<string, number>();
  for (const m of mesajlar ?? []) {
    const k = m.event_id as string;
    sayim.set(k, (sayim.get(k) ?? 0) + 1);
  }
  const defterMap = new Map(
    (defterler ?? []).map((d) => [d.event_id as string, d]),
  );

  return liste.map((o) => {
    const d = defterMap.get(o.id as string);
    return {
      event_id: o.id as string,
      event_title: o.title as string,
      customer_name: (o.customer_name as string) ?? null,
      mesaj_sayisi: sayim.get(o.id as string) ?? 0,
      defter_id: (d?.id as string) ?? null,
      durum: (d?.durum as string) ?? null,
      slug: (d?.slug as string) ?? null,
    };
  });
}

function satirCevir(row: Record<string, unknown>, eventTitle: string): HatiraDefter {
  return {
    id: row.id as string,
    event_id: row.event_id as string,
    event_title: eventTitle,
    slug: (row.slug as string) ?? null,
    baslik: (row.baslik as string) ?? "Hatıra Defteri",
    icerik: coz(row.icerik_sifreli as string | null),
    durum: (row.durum as string) ?? "taslak",
    kaynak_ozet: (row.kaynak_ozet as Record<string, unknown>) ?? {},
    published_at: (row.published_at as string) ?? null,
    updated_at: row.updated_at as string,
  };
}

// Admin editör: tek defter (içerik çözülmüş).
export async function hatiraGetirId(id: string): Promise<HatiraDefter | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("hatira_defteri")
    .select("*, events(title)")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const ev = (data as { events?: { title?: string } }).events;
  return satirCevir(data, ev?.title ?? "Oda");
}

// Etkinliğe ait mevcut defter (varsa).
export async function hatiraEventIcin(eventId: string): Promise<HatiraDefter | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("hatira_defteri")
    .select("*, events(title)")
    .eq("event_id", eventId)
    .maybeSingle();
  if (!data) return null;
  const ev = (data as { events?: { title?: string } }).events;
  return satirCevir(data, ev?.title ?? "Oda");
}

// AI taslağını kaydet: etkinliğin defteri yoksa oluşturur, varsa içeriğini
// (taslak durumunu koruyarak) günceller. İçerik ŞİFRELENİR. id döner.
export async function hatiraTaslakKaydet(
  eventId: string,
  baslik: string,
  icerik: string,
  kaynakOzet: Record<string, unknown>,
): Promise<string | null> {
  const admin = createAdminClient();
  const mevcut = await hatiraEventIcin(eventId);
  const sifreli = sifrele(icerik);

  if (mevcut) {
    const { error } = await admin
      .from("hatira_defteri")
      .update({ baslik, icerik_sifreli: sifreli, kaynak_ozet: kaynakOzet })
      .eq("id", mevcut.id);
    return error ? null : mevcut.id;
  }
  const { data, error } = await admin
    .from("hatira_defteri")
    .insert({
      event_id: eventId,
      baslik,
      icerik_sifreli: sifreli,
      kaynak_ozet: kaynakOzet,
      durum: "taslak",
    })
    .select("id")
    .single();
  return error ? null : (data!.id as string);
}

// Admin'in elle düzenlediği içeriği kaydet (şifreli).
export async function hatiraIcerikKaydet(
  id: string,
  baslik: string,
  icerik: string,
): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("hatira_defteri")
    .update({ baslik, icerik_sifreli: sifrele(icerik) })
    .eq("id", id);
  return !error;
}

// Yayınla / taslağa al. Yayınlarken slug atanır (yoksa) + published_at.
export async function hatiraYayinla(
  id: string,
  yayinla: boolean,
): Promise<{ ok: boolean; slug?: string | null }> {
  const admin = createAdminClient();
  if (!yayinla) {
    const { error } = await admin
      .from("hatira_defteri")
      .update({ durum: "taslak" })
      .eq("id", id);
    return { ok: !error };
  }

  // Yayınla: slug üret (yoksa), durum + published_at.
  const { data: mevcut } = await admin
    .from("hatira_defteri")
    .select("id, slug, baslik, event_id, events(title)")
    .eq("id", id)
    .maybeSingle();
  if (!mevcut) return { ok: false };

  let slug = (mevcut.slug as string) ?? null;
  if (!slug) {
    const ev = (mevcut as { events?: { title?: string } }).events;
    const taban = slugYap(ev?.title || (mevcut.baslik as string) || "hatira");
    slug = `${taban || "hatira"}-${kisaEk()}`;
  }
  const { error } = await admin
    .from("hatira_defteri")
    .update({ durum: "yayinda", slug, published_at: new Date().toISOString() })
    .eq("id", id);
  return { ok: !error, slug };
}

// Public sayfa: yayınlanmış defteri slug ile getir (içerik çözülmüş).
export async function hatiraSlugIle(slug: string): Promise<HatiraDefter | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("hatira_defteri")
    .select("*, events(title)")
    .ilike("slug", slug)
    .eq("durum", "yayinda")
    .maybeSingle();
  if (!data) return null;
  const ev = (data as { events?: { title?: string } }).events;
  return satirCevir(data, ev?.title ?? "");
}
