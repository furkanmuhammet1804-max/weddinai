// =============================================================
// MOBİL OTURUM TOKEN'I — imzalı (HMAC) bearer token.
// Mobil uygulamada çerez yok; oda kodu + şifre doğrulandıktan sonra
// burada imzalı bir token üretilir. Token <eventId>:<slug>:<exp> taşır
// ve slug'a bağlı imzalanır → kurcalanamaz, başka odaya taşınamaz.
// Token mobilde Secure Store'da saklanır; her istekte Authorization
// başlığıyla gönderilir. (Web tarafındaki lib/oda/oturum.ts ile aynı
// HMAC mantığı; sadece çerez yerine bearer token.)
// =============================================================
import { createHmac, timingSafeEqual } from "crypto";

const OMUR_SN = 60 * 60 * 24 * 30; // 30 gün — "tekrar giriş yapmak zorunda kalmasın"

function imzaAnahtari(): string {
  const k =
    process.env.ODA_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!k) throw new Error("Mobil token için imza anahtarı yok.");
  return k;
}

function imzala(veri: string): string {
  return createHmac("sha256", imzaAnahtari()).update(veri).digest("base64url");
}

function imzaEsit(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export function mobilTokenUret(eventId: string, slug: string): string {
  const exp = Math.floor(Date.now() / 1000) + OMUR_SN;
  const b64 = Buffer.from(
    `${eventId}:${slug.toLowerCase()}:${exp}`,
  ).toString("base64url");
  return `${b64}.${imzala(b64)}`;
}

export function mobilTokenCoz(
  token: string | null | undefined,
): { eventId: string; slug: string } | null {
  if (!token) return null;
  const nokta = token.lastIndexOf(".");
  if (nokta < 0) return null;
  const b64 = token.slice(0, nokta);
  const imza = token.slice(nokta + 1);
  if (!b64 || !imza) return null;
  if (!imzaEsit(imza, imzala(b64))) return null;

  let govde: string;
  try {
    govde = Buffer.from(b64, "base64url").toString("utf8");
  } catch {
    return null;
  }
  const [eventId, slug, expStr] = govde.split(":");
  if (!eventId || !slug || !expStr) return null;
  if (Number(expStr) * 1000 <= Date.now()) return null; // süresi dolmuş
  return { eventId, slug };
}

// Authorization: Bearer <token> başlığından token'ı çıkar.
export function bearerToken(request: Request): string | null {
  const h =
    request.headers.get("authorization") ||
    request.headers.get("Authorization");
  if (!h) return null;
  const m = /^Bearer\s+(.+)$/i.exec(h.trim());
  return m ? m[1].trim() : null;
}
