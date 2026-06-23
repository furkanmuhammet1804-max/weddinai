// =============================================================
// MOBİL ADMIN OTURUM TOKEN'I — imzalı (HMAC) bearer token.
//
// Admin mobil uygulamada çerez yok; kullanıcı adı + şifre (env ile) doğrulanır
// (lib/admin/oturum.kimlikDogru) ve burada imzalı bir bearer token üretilir.
// Token <iat>:<exp> taşır ve ADMIN_SESSION_SECRET ile imzalanır → kurcalanamaz.
// Token mobilde Secure Store'da saklanır; her istekte Authorization başlığıyla
// gönderilir. (Web admin çereziyle aynı HMAC mantığı; çerez yerine bearer.)
// =============================================================
import { createHmac, timingSafeEqual } from "crypto";

const OMUR_SN = 60 * 60 * 12; // 12 saat (web admin çereziyle aynı)
const ETIKET = "weddinai-admin-mobil-v1";

function imzaAnahtari(): string {
  const k =
    process.env.ADMIN_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!k) throw new Error("Admin mobil token için imza anahtarı yok.");
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

// Doğru giriş sonrası imzalı token üret.
export function adminTokenUret(): string {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + OMUR_SN;
  const b64 = Buffer.from(`${ETIKET}:${iat}:${exp}`).toString("base64url");
  return `${b64}.${imzala(b64)}`;
}

// Token geçerli mi? (imza + süre). Geçerliyse true.
export function adminTokenGecerli(token: string | null | undefined): boolean {
  if (!token) return false;
  const nokta = token.lastIndexOf(".");
  if (nokta < 0) return false;
  const b64 = token.slice(0, nokta);
  const imza = token.slice(nokta + 1);
  if (!b64 || !imza) return false;
  if (!imzaEsit(imza, imzala(b64))) return false;

  let govde: string;
  try {
    govde = Buffer.from(b64, "base64url").toString("utf8");
  } catch {
    return false;
  }
  const [etiket, , expStr] = govde.split(":");
  if (etiket !== ETIKET || !expStr) return false;
  if (Number(expStr) * 1000 <= Date.now()) return false; // süresi dolmuş
  return true;
}

// Authorization: Bearer <token> başlığını (veya ?token= sorgusunu) doğrula.
// Mobil admin uçlarının ortak kapısı.
export function adminBearerGecerli(request: Request): boolean {
  const h =
    request.headers.get("authorization") ||
    request.headers.get("Authorization");
  let token: string | null = null;
  if (h) {
    const m = /^Bearer\s+(.+)$/i.exec(h.trim());
    if (m) token = m[1].trim();
  }
  // Tarayıcıda açılan akışlar (PDF) için ?token= desteği.
  if (!token) {
    try {
      token = new URL(request.url).searchParams.get("token");
    } catch {
      token = null;
    }
  }
  return adminTokenGecerli(token);
}
