// =============================================================
// YÖNETİCİ (ADMIN) OTURUMU — tek admin, env tabanlı, imzalı (HMAC) çerez.
//
// Admin'in Supabase hesabı YOKTUR. Kimlik doğrulama tamamen env ile:
//   ADMIN_USERNAME / ADMIN_PASSWORD
// Doğru giriş sonrası imzalı bir çerez bırakılır. Çerez kurcalanamaz;
// gizli anahtar yalnızca sunucuda bulunur. Tüm /admin sayfaları ve admin
// API rotaları bu çerezi sunucu tarafında DOĞRULAR (Node runtime).
//
// Kimlik bilgileri ve imza anahtarı KODDA AÇIK TUTULMAZ → env değişkenleri.
// =============================================================
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_ADI = "admin_oturum";
const OMUR_SN = 60 * 60 * 12; // 12 saat
const ETIKET = "weddinai-admin-v1";

function imzaAnahtari(): string {
  const k =
    process.env.ADMIN_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!k) throw new Error("Admin oturumu için imza anahtarı yok.");
  return k;
}

// İmza, oturum başlangıç zamanını (iat) da kapsar → çerez tek/sabit değildir
// ve süresi sunucu tarafında doğrulanır (çalınan eski çerez geçersiz olur).
function imzala(iat: number): string {
  return createHmac("sha256", imzaAnahtari())
    .update(`${ETIKET}:${iat}`)
    .digest("base64url");
}

function esit(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

// Kullanıcı adı + şifre env ile birebir (sabit-zamanlı) eşleşiyor mu?
export function kimlikDogru(kullanici: string, sifre: string): boolean {
  const ku = process.env.ADMIN_USERNAME ?? "";
  const sf = process.env.ADMIN_PASSWORD ?? "";
  if (!ku || !sf) return false;
  // Her ikisini de sabit-zamanlı karşılaştır.
  return esit(kullanici, ku) && esit(sifre, sf);
}

export async function adminOturumKur() {
  const iat = Math.floor(Date.now() / 1000);
  const store = await cookies();
  store.set(COOKIE_ADI, `${iat}.${imzala(iat)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: OMUR_SN,
  });
}

export async function adminOturumGecerli(): Promise<boolean> {
  const store = await cookies();
  const ham = store.get(COOKIE_ADI)?.value;
  if (!ham) return false;
  const nokta = ham.indexOf(".");
  if (nokta < 0) return false;
  const iatStr = ham.slice(0, nokta);
  const sig = ham.slice(nokta + 1);
  const iat = Number(iatStr);
  if (!Number.isFinite(iat) || !sig) return false;
  // Süre kontrolü: imza taze mi?
  const yas = Math.floor(Date.now() / 1000) - iat;
  if (yas < 0 || yas > OMUR_SN) return false;
  try {
    return esit(sig, imzala(iat));
  } catch {
    return false;
  }
}

export async function adminOturumSil() {
  const store = await cookies();
  store.delete(COOKIE_ADI);
}
