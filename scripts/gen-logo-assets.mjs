// One-off generator for WeddinAI brand assets from the gold logo mark.
// sharp is broken in this env, so this does PNG decode/resize/encode + ICO by hand.
// Run: node scripts/gen-logo-assets.mjs <source.png>
import fs from "node:fs";
import zlib from "node:zlib";
import path from "node:path";

const SRC = process.argv[2];
if (!SRC) throw new Error("source png path required");
const ROOT = process.cwd(); // run from project root

/* ---------------- PNG decode (color type 2/6, 8-bit) ---------------- */
function decodePng(buf) {
  let p = 8, w, h, ct, idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p);
    const type = buf.toString("ascii", p + 4, p + 8);
    const data = buf.slice(p + 8, p + 8 + len);
    if (type === "IHDR") { w = data.readUInt32BE(0); h = data.readUInt32BE(4); ct = data[9]; }
    else if (type === "IDAT") idat.push(data);
    else if (type === "IEND") break;
    p += 12 + len;
  }
  const ch = ct === 6 ? 4 : 3;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = w * ch;
  const un = Buffer.alloc(h * stride);
  const paeth = (a, b, c) => { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); return pa <= pb && pa <= pc ? a : pb <= pc ? b : c; };
  let rp = 0;
  for (let y = 0; y < h; y++) {
    const ft = raw[rp++];
    for (let x = 0; x < stride; x++) {
      const v = raw[rp++];
      const a = x >= ch ? un[y * stride + x - ch] : 0;
      const b = y > 0 ? un[(y - 1) * stride + x] : 0;
      const c = x >= ch && y > 0 ? un[(y - 1) * stride + x - ch] : 0;
      let val;
      switch (ft) { case 0: val = v; break; case 1: val = v + a; break; case 2: val = v + b; break; case 3: val = v + ((a + b) >> 1); break; case 4: val = v + paeth(a, b, c); break; }
      un[y * stride + x] = val & 255;
    }
  }
  // normalize to RGBA
  const out = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    out[i * 4] = un[i * ch]; out[i * 4 + 1] = un[i * ch + 1]; out[i * 4 + 2] = un[i * ch + 2];
    out[i * 4 + 3] = ch === 4 ? un[i * ch + 3] : 255;
  }
  return { w, h, data: out };
}

/* ---------------- PNG encode (RGBA, 8-bit) ---------------- */
const crcTable = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(buf) { let c = 0xffffffff; for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}
function encodePng({ w, h, data }) {
  const stride = w * 4;
  const raw = Buffer.alloc(h * (stride + 1));
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0;
    for (let x = 0; x < stride; x++) raw[y * (stride + 1) + 1 + x] = data[y * stride + x];
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}

/* ---------------- ops ---------------- */
function crop(img, x0, y0, cw, ch) {
  const out = new Uint8Array(cw * ch * 4);
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
    const si = ((y0 + y) * img.w + (x0 + x)) * 4, di = (y * cw + x) * 4;
    out[di] = img.data[si]; out[di + 1] = img.data[si + 1]; out[di + 2] = img.data[si + 2]; out[di + 3] = img.data[si + 3];
  }
  return { w: cw, h: ch, data: out };
}
function resize(src, dw, dh) {
  const { w: sw, h: sh, data: sd } = src;
  const out = new Uint8Array(dw * dh * 4);
  const sx = sw / dw, sy = sh / dh;
  const samp = (px, py, c) => { const i = (py * sw + px) * 4; const a = sd[i + 3] / 255; return c === 3 ? sd[i + 3] : sd[i + c] * a; };
  for (let y = 0; y < dh; y++) {
    let fy = (y + 0.5) * sy - 0.5; let y0 = Math.floor(fy); const wy = fy - y0; let y1 = y0 + 1;
    y0 = Math.max(0, Math.min(sh - 1, y0)); y1 = Math.max(0, Math.min(sh - 1, y1));
    for (let x = 0; x < dw; x++) {
      let fx = (x + 0.5) * sx - 0.5; let x0 = Math.floor(fx); const wx = fx - x0; let x1 = x0 + 1;
      x0 = Math.max(0, Math.min(sw - 1, x0)); x1 = Math.max(0, Math.min(sw - 1, x1));
      const o = (y * dw + x) * 4; const v = [0, 0, 0, 0];
      for (let c = 0; c < 4; c++) {
        const top = samp(x0, y0, c) * (1 - wx) + samp(x1, y0, c) * wx;
        const bot = samp(x0, y1, c) * (1 - wx) + samp(x1, y1, c) * wx;
        v[c] = top * (1 - wy) + bot * wy;
      }
      const a = v[3] / 255;
      out[o] = a > 0 ? Math.min(255, Math.round(v[0] / a)) : 0;
      out[o + 1] = a > 0 ? Math.min(255, Math.round(v[1] / a)) : 0;
      out[o + 2] = a > 0 ? Math.min(255, Math.round(v[2] / a)) : 0;
      out[o + 3] = Math.round(v[3]);
    }
  }
  return { w: dw, h: dh, data: out };
}
function radial(w, h, c0, c1) {
  const d = new Uint8Array(w * h * 4); const cx = w / 2, cy = h / 2, maxd = Math.hypot(cx, cy);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const t = Math.min(1, Math.hypot(x - cx, y - cy) / maxd); const i = (y * w + x) * 4;
    d[i] = Math.round(c0[0] + (c1[0] - c0[0]) * t);
    d[i + 1] = Math.round(c0[1] + (c1[1] - c0[1]) * t);
    d[i + 2] = Math.round(c0[2] + (c1[2] - c0[2]) * t);
    d[i + 3] = 255;
  }
  return { w, h, data: d };
}
function over(bg, fg, ox, oy) {
  for (let y = 0; y < fg.h; y++) for (let x = 0; x < fg.w; x++) {
    const fi = (y * fg.w + x) * 4; const a = fg.data[fi + 3] / 255; if (a === 0) continue;
    const bx = ox + x, by = oy + y; if (bx < 0 || by < 0 || bx >= bg.w || by >= bg.h) continue;
    const bi = (by * bg.w + bx) * 4; const ba = bg.data[bi + 3] / 255; const oa = a + ba * (1 - a);
    for (let c = 0; c < 3; c++) bg.data[bi + c] = Math.round((fg.data[fi + c] * a + bg.data[bi + c] * ba * (1 - a)) / (oa || 1));
    bg.data[bi + 3] = Math.round(oa * 255);
  }
}
function solid(w, h, [r, g, b, a = 255]) {
  const d = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) { d[i * 4] = r; d[i * 4 + 1] = g; d[i * 4 + 2] = b; d[i * 4 + 3] = a; }
  return { w, h, data: d };
}
// centered logo on a square bg. bg: {c0,c1} radial | {rgb:[..]} solid | null transparent
function iconCompose(mark, w, h, ratio, bg) {
  const canvas = bg?.rgb
    ? solid(w, h, bg.rgb)
    : bg?.c0
      ? radial(w, h, bg.c0, bg.c1)
      : { w, h, data: new Uint8Array(w * h * 4) };
  const lw = Math.round(w * ratio); const lh = Math.round(lw * mark.h / mark.w);
  const r = resize(mark, lw, lh);
  over(canvas, r, Math.round((w - lw) / 2), Math.round((h - lh) / 2));
  return canvas;
}

/* ---------------- ICO encode (PNG entries) ---------------- */
function encodeIco(pngs) {
  const head = Buffer.alloc(6); head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(pngs.length, 4);
  const entries = []; let offset = 6 + pngs.length * 16;
  const datas = [];
  for (const { size, png } of pngs) {
    const e = Buffer.alloc(16);
    e[0] = size >= 256 ? 0 : size; e[1] = size >= 256 ? 0 : size; e[2] = 0; e[3] = 0;
    e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6); e.writeUInt32LE(png.length, 8); e.writeUInt32LE(offset, 12);
    entries.push(e); datas.push(png); offset += png.length;
  }
  return Buffer.concat([head, ...entries, ...datas]);
}

/* ---------------- run ---------------- */
const src = decodePng(fs.readFileSync(SRC));
// tight content bbox
let minx = src.w, miny = src.h, maxx = 0, maxy = 0;
for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) if (src.data[(y * src.w + x) * 4 + 3] > 20) { if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y; }
const pad = 8;
minx = Math.max(0, minx - pad); miny = Math.max(0, miny - pad); maxx = Math.min(src.w - 1, maxx + pad); maxy = Math.min(src.h - 1, maxy + pad);
const mark = crop(src, minx, miny, maxx - minx + 1, maxy - miny + 1);
console.log("mark", mark.w, "x", mark.h);

const BG = { c0: [58, 34, 51], c1: [26, 14, 22] }; // deep wine radial (yalnız OG)

// Favicon için kare "sembol": geniş markanın merkezindeki kalp+W bölümü.
// Tam yükseklikte, yatayda ortalanmış kare → küçük sekmede dolgun/okunaklı.
const symSide = mark.h;
const symbol = crop(mark, Math.round((mark.w - symSide) / 2), 0, symSide, symSide);
console.log("symbol", symbol.w, "x", symbol.h);

const writes = {};
// transparent horizontal mark for nav/footer (header ayrı kalır)
writes["public/logo.png"] = encodePng(resize(mark, Math.round(256 * mark.w / mark.h), 256));

// --- ŞEFFAF favicon + app ikonları (Blazzotti gibi: kutu yok, sadece sembol) ---
writes["app/icon.png"] = encodePng(iconCompose(symbol, 512, 512, 0.96, null));
writes["app/apple-icon.png"] = encodePng(iconCompose(symbol, 180, 180, 0.96, null));
writes["public/favicon-16x16.png"] = encodePng(iconCompose(symbol, 16, 16, 1.0, null));
writes["public/favicon-32x32.png"] = encodePng(iconCompose(symbol, 32, 32, 1.0, null));
writes["public/apple-touch-icon.png"] = encodePng(iconCompose(symbol, 180, 180, 0.96, null));
writes["public/android-chrome-192x192.png"] = encodePng(iconCompose(symbol, 192, 192, 0.96, null));
writes["public/android-chrome-512x512.png"] = encodePng(iconCompose(symbol, 512, 512, 0.96, null));
// manifest geriye dönük referanslar
writes["public/icon-192.png"] = writes["public/android-chrome-192x192.png"];
writes["public/icon-512.png"] = writes["public/android-chrome-512x512.png"];

// OG / Twitter card 1200x630 (sosyal kart → koyu zemin, tam marka)
{
  const og = radial(1200, 630, BG.c0, BG.c1);
  const lw = 620, lh = Math.round(lw * mark.h / mark.w);
  over(og, resize(mark, lw, lh), Math.round((1200 - lw) / 2), Math.round((630 - lh) / 2) - 6);
  writes["app/opengraph-image.png"] = encodePng(og);
  writes["app/twitter-image.png"] = encodePng(og);
}
// favicon.ico (16/32/48 PNG-in-ICO) — şeffaf
{
  const sizes = [16, 32, 48].map((s) => ({
    size: s,
    png: encodePng(iconCompose(symbol, s, s, 1.0, null)),
  }));
  writes["app/favicon.ico"] = encodeIco(sizes);
}

for (const [rel, buf] of Object.entries(writes)) {
  const dest = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buf);
  console.log("wrote", rel, buf.length, "bytes");
}
console.log("done");
