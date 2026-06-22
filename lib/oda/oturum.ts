// =============================================================
// MÜŞTERİ ODA OTURUMU — imzalı (HMAC) çerez.
// Müşterinin Supabase hesabı yok; oda şifresini doğruladıktan sonra
// burada imzalı bir çerez bırakırız. Çerez <eventId> + son kullanma (exp)
// taşır ve slug'a bağlı imzalanır → kurcalanamaz, başka odaya taşınamaz ve
// sunucu tarafında süresi dolunca reddedilir (yakalanan çerez sonsuza dek
// geçerli kalmaz).
// =============================================================
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_ADI = "oda_oturum";
const OMUR_SN = 60 * 60 * 12; // 12 saat

// İmza anahtarı: service-role key sunucuda her zaman mevcut. (Anahtar
// rotasyonu mevcut oturumları geçersiz kılar — kabul edilebilir.)
function imzaAnahtari(): string {
  const k =
    process.env.ODA_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!k) throw new Error("Oda oturumu için imza anahtarı yok.");
  return k;
}

// İmza, son kullanma (exp) dahil hesaplanır → eski çerez tekrar oynatılamaz.
function imzala(eventId: string, slug: string, exp: number): string {
  return createHmac("sha256", imzaAnahtari())
    .update(`${eventId}:${slug.toLowerCase()}:${exp}`)
    .digest("base64url");
}

function imzaEsit(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

// Doğrulanmış oda için çerezi kurar.
export async function odaOturumKur(eventId: string, slug: string) {
  const exp = Math.floor(Date.now() / 1000) + OMUR_SN;
  const token = `${eventId}.${exp}.${imzala(eventId, slug, exp)}`;
  const store = await cookies();
  store.set(COOKIE_ADI, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: OMUR_SN,
  });
}

// Geçerli oturumun bu slug'a ait eventId'sini döndürür; yoksa/süresi dolmuşsa null.
export async function odaOturumOku(slug: string): Promise<string | null> {
  const store = await cookies();
  const ham = store.get(COOKIE_ADI)?.value;
  if (!ham) return null;
  // Biçim: <eventId>.<exp>.<imza>  (UUID/sayı/base64url içinde nokta yok)
  const parcalar = ham.split(".");
  if (parcalar.length !== 3) return null;
  const [eventId, expStr, imza] = parcalar;
  if (!eventId || !expStr || !imza) return null;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp <= Math.floor(Date.now() / 1000)) return null;
  if (!imzaEsit(imza, imzala(eventId, slug, exp))) return null;
  return eventId;
}

export async function odaOturumSil() {
  const store = await cookies();
  store.delete(COOKIE_ADI);
}
