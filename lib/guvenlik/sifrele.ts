// =============================================================
// UYGULAMA SEVİYESİ ŞİFRELEME — AES-256-GCM (Güvenlik Politikası §2).
// YALNIZCA SUNUCU TARAFI. Hassas metin alanları (hatıra defteri içerikleri,
// özel notlar, iletişim bilgileri vb.) veritabanına ŞİFRELİ yazılır.
//
// Anahtar yalnızca env'de tutulur: APP_ENCRYPTION_KEY
//   - 32 baytlık anahtar; base64 veya hex olarak verilebilir (önerilen: base64).
//   - Üretmek için:  openssl rand -base64 32
// Anahtar koda GÖMÜLMEZ. Anahtar yoksa şifreleme fonksiyonları hata fırlatır
// (sessizce düz metin yazmak YASAK).
//
// Biçim (saklanan string):  v1.<iv_b64url>.<tag_b64url>.<ciphertext_b64url>
//   - v1: şema sürümü (anahtar rotasyonu/algoritma değişimi için)
//   - GCM kimlik doğrulama etiketi (tag) kurcalanmayı tespit eder.
// =============================================================
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "crypto";

const SURUM = "v1";
const ALGO = "aes-256-gcm";
const IV_BAYT = 12; // GCM için önerilen IV uzunluğu

let _anahtar: Buffer | null = null;

function anahtariGetir(): Buffer {
  if (_anahtar) return _anahtar;
  const ham = process.env.APP_ENCRYPTION_KEY;
  if (!ham) {
    throw new Error(
      "APP_ENCRYPTION_KEY tanımlı değil — hassas veri şifrelenemiyor.",
    );
  }
  // base64 veya hex kabul et; 32 bayt olmalı.
  let buf: Buffer;
  if (/^[0-9a-fA-F]{64}$/.test(ham.trim())) {
    buf = Buffer.from(ham.trim(), "hex");
  } else {
    buf = Buffer.from(ham.trim(), "base64");
  }
  if (buf.length !== 32) {
    throw new Error(
      "APP_ENCRYPTION_KEY 32 bayt olmalı (base64: 44 karakter veya hex: 64 karakter).",
    );
  }
  _anahtar = buf;
  return buf;
}

// Şifreleme yapılandırılmış mı? (rota başında nazik kontrol için)
export function sifrelemeHazirMi(): boolean {
  try {
    anahtariGetir();
    return true;
  } catch {
    return false;
  }
}

// Düz metni şifreler. null/boş ise null döner (NULL kolonları korumak için).
export function sifrele(metin: string | null | undefined): string | null {
  if (metin == null || metin === "") return null;
  const anahtar = anahtariGetir();
  const iv = randomBytes(IV_BAYT);
  const cipher = createCipheriv(ALGO, anahtar, iv);
  const ct = Buffer.concat([cipher.update(metin, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    SURUM,
    iv.toString("base64url"),
    tag.toString("base64url"),
    ct.toString("base64url"),
  ].join(".");
}

// Şifreli metni çözer. Şifreli görünmüyorsa (eski düz veri) olduğu gibi döner
// → geriye dönük uyum; ancak yeni veriler daima şifrelenir.
export function coz(saklanan: string | null | undefined): string | null {
  if (saklanan == null || saklanan === "") return null;
  if (!saklanan.startsWith(`${SURUM}.`)) return saklanan; // şifreli değil
  const parcalar = saklanan.split(".");
  if (parcalar.length !== 4) return saklanan;
  const [, ivB64, tagB64, ctB64] = parcalar;
  try {
    const anahtar = anahtariGetir();
    const iv = Buffer.from(ivB64, "base64url");
    const tag = Buffer.from(tagB64, "base64url");
    const ct = Buffer.from(ctB64, "base64url");
    const decipher = createDecipheriv(ALGO, anahtar, iv);
    decipher.setAuthTag(tag);
    const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
    return pt.toString("utf8");
  } catch {
    // Çözme başarısız (yanlış anahtar/kurcalanmış) → güvenli tarafta null.
    return null;
  }
}
