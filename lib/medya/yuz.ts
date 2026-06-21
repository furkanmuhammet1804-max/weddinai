// =============================================================
// LOKAL YÜZ TESPİTİ — pico.js uyarlaması (Özellik 4 revizyonu).
// YALNIZCA SUNUCU TARAFI. Fotoğraf HİÇBİR YERE GÖNDERİLMEZ (Güvenlik §5/§6):
// sharp ile gri tonlamalı ham piksellere indirilir, pico tabanlı bir karar
// ağacı kademesi (assets/models/facefinder) ile yüzler sayılır.
//
// pico.js MIT lisanslıdır (github.com/nenadmarkus/picojs). Kademe dosyası da
// MIT (github.com/nenadmarkus/pico). Saf JS — yerel ML çerçevesi/native bağımlılık yok.
//
// Sonuç: yüz adedi → 0–1 yüz "tekli", 2+ yüz "toplu".
// =============================================================
import fs from "fs";
import path from "path";
import sharp from "sharp";

const CASCADE_PATH = path.join(process.cwd(), "assets", "models", "facefinder");

// Tespit parametreleri (pico).
const SHIFT_FACTOR = 0.1;
const SCALE_FACTOR = 1.1;
const IOU_ESIK = 0.2;
const KALITE_ESIK = 6.0; // kümelenmiş skor bunun altındaysa yüz sayılmaz
const MINSIZE_ORAN = 0.06; // en küçük yüz, kısa kenarın bu oranı kadar
// İşleme boyutu: büyük fotoları küçültüp hızlandırır (yüz oranı korunur).
const ISLEME_KENAR = 640;
// pico yalnız dik (frontal) yüz bulur; yana eğik selfie yüzlerini de
// yakalamak için birkaç düzlem-içi açıda tarayıp en yüksek sayıyı alırız.
const ACILAR = [0, -22, 22];

type ClassifyFn = (
  r: number,
  c: number,
  s: number,
  pixels: Uint8Array,
  ldim: number,
) => number;

let _classify: ClassifyFn | null = null;

// ---- Kademe dosyasını çöz (pico.unpack_cascade uyarlaması) ----
function unpackCascade(bytes: Uint8Array): ClassifyFn {
  const dview = new DataView(new ArrayBuffer(4));
  let p = 8; // ilk 8 bayt: sürüm + eğitim verisi (atlanır)

  dview.setUint8(0, bytes[p]); dview.setUint8(1, bytes[p + 1]);
  dview.setUint8(2, bytes[p + 2]); dview.setUint8(3, bytes[p + 3]);
  const tdepth = dview.getInt32(0, true);
  p += 4;

  dview.setUint8(0, bytes[p]); dview.setUint8(1, bytes[p + 1]);
  dview.setUint8(2, bytes[p + 2]); dview.setUint8(3, bytes[p + 3]);
  const ntrees = dview.getInt32(0, true);
  p += 4;

  const tcodes_ls: number[] = [];
  const tpreds_ls: number[] = [];
  const thresh_ls: number[] = [];

  for (let t = 0; t < ntrees; ++t) {
    tcodes_ls.push(0, 0, 0, 0);
    for (let i = 0; i < 4 * Math.pow(2, tdepth) - 4; ++i) tcodes_ls.push(bytes[p + i]);
    p += 4 * Math.pow(2, tdepth) - 4;
    for (let i = 0; i < Math.pow(2, tdepth); ++i) {
      dview.setUint8(0, bytes[p]); dview.setUint8(1, bytes[p + 1]);
      dview.setUint8(2, bytes[p + 2]); dview.setUint8(3, bytes[p + 3]);
      tpreds_ls.push(dview.getFloat32(0, true));
      p += 4;
    }
    dview.setUint8(0, bytes[p]); dview.setUint8(1, bytes[p + 1]);
    dview.setUint8(2, bytes[p + 2]); dview.setUint8(3, bytes[p + 3]);
    thresh_ls.push(dview.getFloat32(0, true));
    p += 4;
  }

  const tcodes = new Int8Array(tcodes_ls);
  const tpreds = new Float32Array(tpreds_ls);
  const thresh = new Float32Array(thresh_ls);

  return function classify_region(r, c, s, pixels, ldim) {
    r = 256 * r;
    c = 256 * c;
    let root = 0;
    let o = 0.0;
    const pow2tdepth = Math.pow(2, tdepth) >> 0;

    for (let i = 0; i < ntrees; ++i) {
      let idx = 1;
      for (let j = 0; j < tdepth; ++j) {
        idx = 2 * idx +
          (pixels[((r + tcodes[root + 4 * idx + 0] * s) >> 8) * ldim + ((c + tcodes[root + 4 * idx + 1] * s) >> 8)] <=
            pixels[((r + tcodes[root + 4 * idx + 2] * s) >> 8) * ldim + ((c + tcodes[root + 4 * idx + 3] * s) >> 8)]
            ? 1 : 0);
      }
      o += tpreds[pow2tdepth * i + idx - pow2tdepth];
      if (o <= thresh[i]) return -1;
      root += 4 * pow2tdepth;
    }
    return o - thresh[ntrees - 1];
  };
}

function getClassifier(): ClassifyFn | null {
  if (_classify) return _classify;
  try {
    const buf = fs.readFileSync(CASCADE_PATH);
    _classify = unpackCascade(new Uint8Array(buf));
    return _classify;
  } catch {
    return null; // kademe yoksa → tespit yapılamaz (çağıran null sayar)
  }
}

// ---- Çok ölçekli tarama (pico.run_cascade) ----
function runCascade(
  pixels: Uint8Array,
  nrows: number,
  ncols: number,
  classify: ClassifyFn,
): number[][] {
  const ldim = ncols;
  const minsize = Math.max(20, Math.round(MINSIZE_ORAN * Math.min(nrows, ncols)));
  const maxsize = Math.min(nrows, ncols);
  const detections: number[][] = [];

  let scale = minsize;
  while (scale <= maxsize) {
    const step = Math.max(SHIFT_FACTOR * scale, 1) >> 0;
    const offset = (scale / 2 + 1) >> 0;
    for (let r = offset; r <= nrows - offset; r += step)
      for (let c = offset; c <= ncols - offset; c += step) {
        const q = classify(r, c, scale, pixels, ldim);
        if (q > 0.0) detections.push([r, c, scale, q]);
      }
    scale = scale * SCALE_FACTOR;
  }
  return detections;
}

// ---- Maksimum olmayan bastırma ile kümeleme (pico.cluster_detections) ----
function clusterDetections(dets: number[][], iouEsik: number): number[][] {
  dets = dets.slice().sort((a, b) => b[3] - a[3]);
  function iou(d1: number[], d2: number[]): number {
    const [r1, c1, s1] = d1;
    const [r2, c2, s2] = d2;
    const overr = Math.max(0, Math.min(r1 + s1 / 2, r2 + s2 / 2) - Math.max(r1 - s1 / 2, r2 - s2 / 2));
    const overc = Math.max(0, Math.min(c1 + s1 / 2, c2 + s2 / 2) - Math.max(c1 - s1 / 2, c2 - s2 / 2));
    return (overr * overc) / (s1 * s1 + s2 * s2 - overr * overc);
  }
  const assignments = new Array(dets.length).fill(0);
  const clusters: number[][] = [];
  for (let i = 0; i < dets.length; ++i) {
    if (assignments[i] === 0) {
      let r = 0, c = 0, s = 0, q = 0, n = 0;
      for (let j = i; j < dets.length; ++j) {
        if (iou(dets[i], dets[j]) > iouEsik) {
          assignments[j] = 1;
          r += dets[j][0]; c += dets[j][1]; s += dets[j][2]; q += dets[j][3]; n += 1;
        }
      }
      clusters.push([r / n, c / n, s / n, q]);
    }
  }
  return clusters;
}

export interface YuzSonuc {
  yuzSayisi: number;
  // 'tekli' = 0–1 yüz, 'toplu' = 2+ yüz
  kategori: "tekli" | "toplu";
}

// Tek bir açıda yüz sayısını çıkarır.
async function biracidaSay(buf: Buffer, classify: ClassifyFn, aci: number): Promise<number | null> {
  let gri: Buffer;
  let nrows: number;
  let ncols: number;
  try {
    let p = sharp(buf).rotate(); // önce EXIF'e göre düzelt
    if (aci !== 0) p = p.rotate(aci, { background: { r: 0, g: 0, b: 0 } });
    const out = await p
      .greyscale()
      .resize(ISLEME_KENAR, ISLEME_KENAR, { fit: "inside", withoutEnlargement: true })
      .raw()
      .toBuffer({ resolveWithObject: true });
    gri = out.data;
    ncols = out.info.width;
    nrows = out.info.height;
  } catch {
    return null;
  }
  if (!nrows || !ncols) return null;
  const pixels = new Uint8Array(gri.buffer, gri.byteOffset, gri.byteLength);
  const dets = runCascade(pixels, nrows, ncols, classify);
  return clusterDetections(dets, IOU_ESIK).filter((d) => d[3] >= KALITE_ESIK).length;
}

// Bir fotoğraf baytından yüz sayısını ve tekli/toplu kategorisini çıkarır.
// Birkaç açıda tarayıp en yüksek yüz sayısını alır (eğik yüz recall'i için).
// Kademe yoksa veya görsel hiç çözümlenemezse null döner (çağıran karar verir).
export async function yuzTespit(buf: Buffer): Promise<YuzSonuc | null> {
  const classify = getClassifier();
  if (!classify) return null;

  let enYuksek = -1;
  for (const aci of ACILAR) {
    const n = await biracidaSay(buf, classify, aci);
    if (n !== null && n > enYuksek) enYuksek = n;
  }
  if (enYuksek < 0) return null; // hiçbir açı çözümlenemedi

  const yuzSayisi = enYuksek;
  return { yuzSayisi, kategori: yuzSayisi >= 2 ? "toplu" : "tekli" };
}
