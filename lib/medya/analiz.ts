// =============================================================
// LOKAL GÖRSEL ANALİZİ — sharp ile (Özellik 4). YALNIZCA SUNUCU TARAFI.
// Bulanık / karanlık / kalite skoru / algısal hash (aHash) hesaplar.
// Fotoğraf DIŞARI gönderilmez (Güvenlik Politikası §5). Yinelenen/benzer
// gruplaması, aHash'ler arası Hamming mesafesiyle üst katmanda yapılır.
// =============================================================
import sharp from "sharp";

// Eşikler (sezgisel; gerekirse ayarlanır).
const KARANLIK_ESIK = 50; // ortalama parlaklık (0..255) bunun altıysa karanlık
const BULANIK_ESIK = 120; // Laplacian varyansı bunun altıysa bulanık

// 3x3 Laplacian çekirdeği — kenar/keskinlik ölçümü.
const LAPLACIAN = { width: 3, height: 3, kernel: [0, 1, 0, 1, -4, 1, 0, 1, 0] };

export interface GorselMetrik {
  bulanik: boolean;
  karanlik: boolean;
  kaliteSkor: number; // 0..100
  phash: string; // 16 hex karakter (64 bit aHash)
}

function kelepce(x: number, alt: number, ust: number): number {
  return Math.max(alt, Math.min(ust, x));
}

// 8x8 gri görüntüden ortalama-hash (aHash) → 16 hex karakter.
async function aHash(buf: Buffer): Promise<string> {
  const ham = await sharp(buf)
    .greyscale()
    .resize(8, 8, { fit: "fill" })
    .raw()
    .toBuffer();
  let toplam = 0;
  for (let i = 0; i < 64; i++) toplam += ham[i] ?? 0;
  const ort = toplam / 64;
  let hex = "";
  for (let bayt = 0; bayt < 8; bayt++) {
    let deger = 0;
    for (let bit = 0; bit < 8; bit++) {
      const idx = bayt * 8 + bit;
      if ((ham[idx] ?? 0) >= ort) deger |= 1 << (7 - bit);
    }
    hex += deger.toString(16).padStart(2, "0");
  }
  return hex;
}

export async function gorselMetrik(buf: Buffer): Promise<GorselMetrik> {
  // Parlaklık (orijinal gri görüntü ortalaması).
  const griStat = await sharp(buf).greyscale().stats();
  const parlaklik = griStat.channels[0]?.mean ?? 128;

  // Keskinlik (Laplacian sonrası standart sapmanın karesi = varyans).
  const edgeStat = await sharp(buf).greyscale().convolve(LAPLACIAN).stats();
  const edgeStd = edgeStat.channels[0]?.stdev ?? 0;
  const varyans = edgeStd * edgeStd;

  const phash = await aHash(buf);

  const karanlik = parlaklik < KARANLIK_ESIK;
  const bulanik = varyans < BULANIK_ESIK;

  // Kalite skoru: keskinlik (0.7) + ideal parlaklığa yakınlık (0.3).
  const keskinlikSkor = kelepce(varyans / (BULANIK_ESIK * 4), 0, 1);
  const parlaklikSkor = 1 - Math.abs(parlaklik - 128) / 128;
  const kaliteSkor = Math.round(
    100 * (0.7 * keskinlikSkor + 0.3 * kelepce(parlaklikSkor, 0, 1)),
  );

  return { bulanik, karanlik, kaliteSkor, phash };
}

// İki aHash (hex) arasındaki Hamming mesafesi (farklı bit sayısı).
export function hammingHex(a: string | null, b: string | null): number {
  if (!a || !b || a.length !== b.length) return 64;
  let mesafe = 0;
  for (let i = 0; i < a.length; i += 2) {
    const x = parseInt(a.slice(i, i + 2), 16) ^ parseInt(b.slice(i, i + 2), 16);
    let v = x;
    while (v) {
      mesafe += v & 1;
      v >>= 1;
    }
  }
  return mesafe;
}

// Yinelenen: mesafe <= 2 ; Benzer: mesafe <= 10 (ayarlanabilir).
export const YINELENEN_ESIK = 2;
export const BENZER_ESIK = 10;

// Vision'a göndermeden önce küçült (§5: minimum veri + maliyet). 512px JPEG.
export async function kucukJpeg(buf: Buffer): Promise<Buffer> {
  return sharp(buf)
    .resize(512, 512, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 70 })
    .toBuffer();
}
