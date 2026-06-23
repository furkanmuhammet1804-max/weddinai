// =============================================================
// PUSH BİLDİRİM — sunucu tarafı (service-role) + Expo push servisi.
//
// Mobil uygulamalar token kaydeder (push_tokens, 0019). Admin bildirim
// gönderdiğinde ilgili token'lar okunur ve Expo'ya iletilir.
// Expo push API: https://exp.host/--/api/v2/push/send
//
// Tablo henüz migrate edilmemişse (PGRST/42P01) işlemler sessizce no-op olur →
// production'ı asla bozma; bildirim "0 alıcı" döner.
// =============================================================
import { createAdminClient } from "@/lib/supabase/admin";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

function tabloYok(e: { code?: string; message?: string } | null | undefined): boolean {
  if (!e) return false;
  return (
    e.code === "42P01" ||
    e.code === "PGRST205" ||
    /push_tokens/i.test(e.message ?? "") ||
    /does not exist|relation/i.test(e.message ?? "")
  );
}

export type PushRol = "musteri" | "admin";

// Token kaydet/güncelle (token benzersiz → upsert).
export async function pushTokenKaydet(
  token: string,
  eventId: string | null,
  platform: string,
  rol: PushRol,
): Promise<boolean> {
  if (!token) return false;
  const admin = createAdminClient();
  const { error } = await admin
    .from("push_tokens")
    .upsert(
      {
        token,
        event_id: eventId,
        platform: platform || "unknown",
        rol,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "token" },
    );
  if (error && !tabloYok(error)) {
    console.error("[push] kayit hata", error.message);
    return false;
  }
  return !error;
}

export async function pushTokenSil(token: string): Promise<boolean> {
  if (!token) return false;
  const admin = createAdminClient();
  const { error } = await admin.from("push_tokens").delete().eq("token", token);
  if (error && !tabloYok(error)) {
    console.error("[push] sil hata", error.message);
    return false;
  }
  return !error;
}

// Belirli odaya (eventId) veya tüm müşterilere ait token'ları getir.
async function tokenlariGetir(eventId: string | null): Promise<string[]> {
  const admin = createAdminClient();
  let q = admin.from("push_tokens").select("token").eq("rol", "musteri");
  if (eventId) q = q.eq("event_id", eventId);
  const { data, error } = await q;
  if (error) {
    if (!tabloYok(error)) console.error("[push] token getir hata", error.message);
    return [];
  }
  return (data ?? []).map((r) => r.token as string).filter(Boolean);
}

// Expo push gönderimi (100'lük partiler). Geçerli alıcı sayısını döndürür.
export async function pushGonder(
  eventId: string | null,
  baslik: string,
  mesaj: string,
): Promise<number> {
  const tokenlar = await tokenlariGetir(eventId);
  if (tokenlar.length === 0) return 0;

  let gonderilen = 0;
  for (let i = 0; i < tokenlar.length; i += 100) {
    const parti = tokenlar.slice(i, i + 100).map((to) => ({
      to,
      title: baslik,
      body: mesaj,
      sound: "default" as const,
    }));
    try {
      const yanit = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parti),
      });
      if (yanit.ok) gonderilen += parti.length;
      else console.error("[push] Expo yanıt", yanit.status, await yanit.text());
    } catch (e) {
      console.error("[push] Expo gönderim hatası", e);
    }
  }
  return gonderilen;
}
