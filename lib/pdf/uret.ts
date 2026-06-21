// =============================================================
// SUNUCU TARAFI PDF ÜRETİMİ — pdfkit (saf JS, serverless-uyumlu).
// Hatıra Defteri (F3) ve Albüm (F5) için. Türkçe için gömülü tr.ttf.
// =============================================================
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { BOLUM_DUZEN } from "@/lib/album/sabit";
import type { Album } from "@/lib/album/veri";

const FONT_PATH = path.join(process.cwd(), "assets", "fonts", "tr.ttf");
const ALTIN = "#b8860b";
const MUT = "#78716c";

function fontKayit(doc: PDFKit.PDFDocument) {
  try {
    const buf = fs.readFileSync(FONT_PATH);
    doc.registerFont("tr", buf);
    doc.font("tr");
  } catch {
    doc.font("Helvetica"); // font bulunamazsa varsayılan (Türkçe kısıtlı)
  }
}

function topla(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((res, rej) => {
    const ch: Buffer[] = [];
    doc.on("data", (d) => ch.push(d as Buffer));
    doc.on("end", () => res(Buffer.concat(ch)));
    doc.on("error", rej);
  });
}

async function gorselBaytlari(url: string | null): Promise<Buffer | null> {
  if (!url) return null;
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    return Buffer.from(await r.arrayBuffer());
  } catch {
    return null;
  }
}

function trTarih(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

// ---- F3: Hatıra Defteri PDF ----
export interface HatiraPdfGirdi {
  baslik: string;
  ciftBaslik: string; // event title (çift)
  tarih: string | null; // published_at
  icerik: string | null; // AI taslak/final
  mesajlar: { ad: string | null; mesaj: string }[];
}

export async function hatiraPdf(g: HatiraPdfGirdi): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margin: 56 });
  const bitti = topla(doc);
  fontKayit(doc);
  const W = doc.page.width - 112;

  // Kapak
  doc.moveDown(6);
  doc.fontSize(11).fillColor(ALTIN).text("HATIRA DEFTERİ", { align: "center", characterSpacing: 4 });
  doc.moveDown(1);
  doc.fontSize(32).fillColor("#1c1917").text(g.ciftBaslik, { align: "center" });
  if (g.baslik && g.baslik !== g.ciftBaslik) {
    doc.moveDown(0.4).fontSize(15).fillColor(MUT).text(g.baslik, { align: "center" });
  }
  if (g.tarih) {
    doc.moveDown(1).fontSize(12).fillColor(MUT).text(trTarih(g.tarih), { align: "center", characterSpacing: 2 });
  }

  // İçerik (AI narrative) — basit Markdown başlık desteği
  if (g.icerik) {
    doc.addPage();
    for (const ham of g.icerik.split(/\r?\n/)) {
      const t = ham.trim();
      if (!t) { doc.moveDown(0.5); continue; }
      if (t.startsWith("## ")) {
        doc.moveDown(0.6).fontSize(17).fillColor("#1c1917").text(t.slice(3), { width: W });
        doc.moveDown(0.2);
      } else if (t.startsWith("# ")) {
        doc.moveDown(0.6).fontSize(20).fillColor("#1c1917").text(t.slice(2), { width: W });
        doc.moveDown(0.2);
      } else {
        doc.fontSize(12).fillColor("#3a3530").text(t, { width: W, align: "left" });
      }
    }
  }

  // Tüm mesajlar + sahipleri
  if (g.mesajlar.length > 0) {
    doc.addPage();
    doc.fontSize(20).fillColor("#1c1917").text("Misafir Mesajları", { width: W });
    doc.moveDown(0.8);
    for (const m of g.mesajlar) {
      doc.fontSize(12).fillColor("#3a3530").text(m.mesaj, { width: W });
      doc.fontSize(11).fillColor(ALTIN).text(`— ${m.ad || "İsimsiz"}`, { width: W });
      doc.moveDown(0.8);
    }
  }

  doc.end();
  return bitti;
}

// ---- F5: Albüm PDF ----
export async function albumPdf(album: Album): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margin: 40, bufferPages: true });
  const bitti = topla(doc);
  fontKayit(doc);
  const W = doc.page.width - 80;
  const H = doc.page.height - 80;

  // Kapak
  const kapakFoto =
    album.fotograflar.find((f) => f.media_id === album.kapak_media_id) ?? album.fotograflar[0];
  const kapakBuf = await gorselBaytlari(kapakFoto?.url ?? null);
  if (kapakBuf) {
    try { doc.image(kapakBuf, 40, 40, { fit: [W, H - 120], align: "center", valign: "center" }); } catch { /* atla */ }
  }
  doc.moveDown(0);
  doc.y = doc.page.height - 110;
  doc.fontSize(28).fillColor("#1c1917").text(album.baslik, 40, doc.y, { width: W, align: "center" });
  doc.fontSize(12).fillColor(MUT).text(trTarih(album.published_at), { width: W, align: "center" });

  // Bölümler (hikâye akışı sırasıyla)
  const gruplar = new Map<string, typeof album.fotograflar>();
  for (const f of album.fotograflar) {
    const b = f.bolum ?? "Diğer";
    const arr = gruplar.get(b);
    if (arr) arr.push(f); else gruplar.set(b, [f]);
  }
  const sirali = [...gruplar.entries()].sort(
    (a, b) => (BOLUM_DUZEN.indexOf(a[0]) < 0 ? 99 : BOLUM_DUZEN.indexOf(a[0])) -
              (BOLUM_DUZEN.indexOf(b[0]) < 0 ? 99 : BOLUM_DUZEN.indexOf(b[0])),
  );

  const KOL = 2, GEN = (W - 16) / KOL, YUK = 200;
  for (const [bolum, fotolar] of sirali) {
    doc.addPage();
    doc.fontSize(20).fillColor(ALTIN).text(bolum, { width: W });
    doc.moveDown(0.6);
    let i = 0;
    for (const f of fotolar) {
      const buf = await gorselBaytlari(f.url);
      if (!buf) continue;
      const kol = i % KOL;
      if (kol === 0 && doc.y + YUK > doc.page.height - 50) doc.addPage();
      const x = 40 + kol * (GEN + 16);
      const y = doc.y;
      try { doc.image(buf, x, y, { fit: [GEN, YUK], align: "center", valign: "center" }); } catch { continue; }
      if (kol === KOL - 1) doc.y = y + YUK + 14;
      i++;
    }
    if (i % KOL !== 0) doc.y += YUK + 14;
  }

  // Sayfa numaraları
  const aralik = doc.bufferedPageRange();
  for (let p = aralik.start; p < aralik.start + aralik.count; p++) {
    doc.switchToPage(p);
    doc.fontSize(9).fillColor(MUT).text(
      `${p - aralik.start + 1} / ${aralik.count}`,
      40, doc.page.height - 28, { width: W, align: "center" },
    );
  }

  doc.end();
  return bitti;
}
