// =============================================================
// KVKK — AI MEDYA İŞLEME ONAY AKIŞI (sunucu tarafı, service-role).
//
// Her oda için tahmin edilemez bir onay token'ı üretilir. Müşteri
// /ai-onay/<token> linkinden KVKK metnini okuyup onaylar; YALNIZCA o
// etkinlikte ai_medya_onay=true olur ve onay tarihi + IP kanıt saklanır.
//
// GÜVENLİK: token rastgele 32 bayt (base64url) → kaba kuvvet edilemez. Onay
// idempotent; token yalnızca etkinliği bulmaya yarar, sızdırırsa yalnız
// "AI işlemeye onay" verdirir (medya/PII açığa çıkmaz). IP düz saklanır
// (KVKK ispat yükümlülüğü; politika telefon/e-postayı şifreler, IP istisna).
// =============================================================
import { randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { onaySonrasiKuyrugaAl } from "@/lib/medya/veri";

export interface OnayOda {
  event_id: string;
  title: string;
  customer_name: string | null;
  event_date: string | null;
  ai_medya_onay: boolean;
  ai_medya_onay_at: string | null;
}

function tokenUret(): string {
  return randomBytes(24).toString("base64url"); // 32 karakter, URL-güvenli
}

// Etkinliğin onay token'ını getirir; yoksa üretip kaydeder (admin link için).
export async function onayTokenGetirVeyaUret(eventId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("events")
    .select("ai_onay_token")
    .eq("id", eventId)
    .maybeSingle();
  if (!data) return null;
  if (data.ai_onay_token) return data.ai_onay_token as string;

  // Çakışmayı önlemek için birkaç kez dene (unique index var).
  for (let i = 0; i < 5; i++) {
    const tok = tokenUret();
    const { error } = await admin
      .from("events")
      .update({ ai_onay_token: tok })
      .eq("id", eventId)
      .is("ai_onay_token", null);
    if (!error) {
      const { data: tekrar } = await admin
        .from("events")
        .select("ai_onay_token")
        .eq("id", eventId)
        .maybeSingle();
      if (tekrar?.ai_onay_token) return tekrar.ai_onay_token as string;
    }
  }
  return null;
}

// Token'a karşılık gelen odayı döndürür (public onay sayfası için).
export async function onayOdaBul(token: string): Promise<OnayOda | null> {
  if (!token || token.length < 16) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from("events")
    .select("id, title, customer_name, event_date, ai_medya_onay, ai_medya_onay_at")
    .eq("ai_onay_token", token)
    .maybeSingle();
  if (!data) return null;
  return {
    event_id: data.id as string,
    title: data.title as string,
    customer_name: (data.customer_name as string) ?? null,
    event_date: (data.event_date as string) ?? null,
    ai_medya_onay: !!data.ai_medya_onay,
    ai_medya_onay_at: (data.ai_medya_onay_at as string) ?? null,
  };
}

// Onayı kaydeder (idempotent). IP kanıt olarak saklanır.
export async function onayVer(token: string, ip: string | null): Promise<boolean> {
  if (!token || token.length < 16) return false;
  const admin = createAdminClient();
  const { data: ev } = await admin
    .from("events")
    .select("id")
    .eq("ai_onay_token", token)
    .maybeSingle();
  if (!ev) return false;
  const eventId = ev.id as string;
  const { error } = await admin
    .from("events")
    .update({
      ai_medya_onay: true,
      ai_medya_onay_at: new Date().toISOString(),
      ai_medya_onay_ip: ip ? ip.slice(0, 64) : null,
    })
    .eq("id", eventId);
  if (error) return false;
  // Onaydan önce yüklenmiş kategorisiz fotoğrafları yeniden kuyruğa al.
  await onaySonrasiKuyrugaAl(eventId);
  return true;
}
