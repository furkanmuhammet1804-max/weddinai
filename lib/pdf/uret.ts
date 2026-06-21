// =============================================================
// SUNUCU TARAFI PDF ÜRETİMİ — pdfkit (saf JS, serverless-uyumlu).
// Hatıra Defteri (F3) ve Dijital Albüm (F5) için LÜKS tasarım:
// krem/fildişi zemin, altın detaylar, büyük tipografi, tam sayfa görseller,
// bölüm kapakları — "kahve masası kitabı" / profesyonel düğün albümü hissi.
// Türkçe için gömülü tr.ttf.
// =============================================================
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { BOLUM_DUZEN } from "@/lib/album/sabit";
import type { Album, AlbumFoto } from "@/lib/album/veri";

const FONT_PATH = path.join(process.cwd(), "assets", "fonts", "tr.ttf");

// ---- Lüks palet ----
const KREM = "#FBF7EF";
const FILDISI = "#F1E7D5";
const ALTIN = "#B8860B";
const ALTIN_ACIK = "#C9A24B";
const KAHVE = "#3B312A";
const MUT = "#8A7E6F";

function fontKayit(doc: PDFKit.PDFDocument) {
  try {
    const buf = fs.readFileSync(FONT_PATH);
    doc.registerFont("tr", buf);
    doc.font("tr");
  } catch {
    doc.font("Helvetica");
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

// ---- Ortak çizim yardımcıları ----
function zeminBoya(doc: PDFKit.PDFDocument, renk = KREM) {
  doc.save();
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(renk);
  doc.restore();
  doc.fillColor(KAHVE);
}

function yeniSayfa(doc: PDFKit.PDFDocument, renk = KREM) {
  doc.addPage();
  zeminBoya(doc, renk);
}

// Sayfa kenarına ince çift altın çerçeve (kapak sayfaları için).
function cerceve(doc: PDFKit.PDFDocument, inset = 26) {
  const W = doc.page.width;
  const H = doc.page.height;
  doc.save();
  doc.lineWidth(1.4).strokeColor(ALTIN);
  doc.rect(inset, inset, W - 2 * inset, H - 2 * inset).stroke();
  doc.lineWidth(0.6).strokeColor(ALTIN_ACIK);
  doc.rect(inset + 5, inset + 5, W - 2 * inset - 10, H - 2 * inset - 10).stroke();
  doc.restore();
}

// Ortalanmış altın ayraç + küçük elmas süs.
function altinAyrac(doc: PDFKit.PDFDocument, y: number, genislik = 120) {
  const orta = doc.page.width / 2;
  doc.save();
  doc.lineWidth(0.8).strokeColor(ALTIN);
  doc.moveTo(orta - genislik / 2, y).lineTo(orta - 10, y).stroke();
  doc.moveTo(orta + 10, y).lineTo(orta + genislik / 2, y).stroke();
  // elmas
  doc.fillColor(ALTIN);
  doc.moveTo(orta, y - 4).lineTo(orta + 4, y).lineTo(orta, y + 4).lineTo(orta - 4, y).fill();
  doc.restore();
}

// ---- F3: Hatıra Defteri PDF ----
export interface HatiraPdfGirdi {
  baslik: string;
  ciftBaslik: string; // event title (çift)
  tarih: string | null; // published_at
  icerik: string | null; // AI taslak/final (hoş geldiniz / hikâye)
  mesajlar: { ad: string | null; mesaj: string }[];
}

export async function hatiraPdf(g: HatiraPdfGirdi): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margin: 0, bufferPages: true });
  const bitti = topla(doc);
  fontKayit(doc);
  const W = doc.page.width;
  const KENAR = 64;
  const IC = W - 2 * KENAR;

  // ---- Kapak ----
  zeminBoya(doc, KREM);
  cerceve(doc, 26);
  doc.fillColor(ALTIN).fontSize(12).text("HATIRA DEFTERİ", 0, 150, {
    align: "center",
    characterSpacing: 6,
  });
  altinAyrac(doc, 184);
  doc.fillColor(KAHVE).fontSize(40).text(g.ciftBaslik, KENAR, 220, {
    width: IC,
    align: "center",
  });
  if (g.baslik && g.baslik !== g.ciftBaslik) {
    doc.moveDown(0.5).fillColor(MUT).fontSize(16).text(g.baslik, KENAR, undefined, {
      width: IC,
      align: "center",
    });
  }
  if (g.tarih) {
    doc.fillColor(ALTIN).fontSize(13).text(trTarih(g.tarih), KENAR, 360, {
      width: IC,
      align: "center",
      characterSpacing: 3,
    });
  }
  doc.fillColor(MUT).fontSize(11).text("hoş geldiniz", KENAR, doc.page.height - 130, {
    width: IC,
    align: "center",
    characterSpacing: 2,
  });

  // ---- Hoş geldiniz / hikâye (AI içerik) ----
  if (g.icerik && g.icerik.trim()) {
    yeniSayfa(doc, KREM);
    doc.fillColor(ALTIN).fontSize(11).text("HOŞ GELDİNİZ", KENAR, 80, {
      width: IC,
      align: "center",
      characterSpacing: 5,
    });
    altinAyrac(doc, 108);
    doc.moveDown(2);
    doc.x = KENAR;
    for (const ham of g.icerik.split(/\r?\n/)) {
      const t = ham.trim();
      if (!t) {
        doc.moveDown(0.6);
        continue;
      }
      if (t.startsWith("## ")) {
        doc.moveDown(0.6).fillColor(KAHVE).fontSize(18).text(t.slice(3), KENAR, doc.y, { width: IC, align: "center" });
        doc.moveDown(0.2);
      } else if (t.startsWith("# ")) {
        doc.moveDown(0.6).fillColor(KAHVE).fontSize(22).text(t.slice(2), KENAR, doc.y, { width: IC, align: "center" });
        doc.moveDown(0.2);
      } else {
        doc.fillColor("#4A4036").fontSize(12.5).text(t, KENAR, doc.y, {
          width: IC,
          align: "justify",
          lineGap: 5,
        });
      }
      if (doc.y > doc.page.height - 120) yeniSayfa(doc, KREM);
    }
  }

  // ---- Tebrik mesajları ----
  if (g.mesajlar.length > 0) {
    yeniSayfa(doc, FILDISI);
    doc.fillColor(ALTIN).fontSize(11).text("TEBRİK MESAJLARI", KENAR, 80, {
      width: IC,
      align: "center",
      characterSpacing: 5,
    });
    altinAyrac(doc, 108);
    doc.moveDown(2.2);
    doc.x = KENAR;
    for (const m of g.mesajlar) {
      if (doc.y > doc.page.height - 150) {
        yeniSayfa(doc, FILDISI);
        doc.x = KENAR;
        doc.y = 90;
      }
      doc.fillColor("#4A4036").fontSize(13).text(`“${m.mesaj}”`, KENAR + 16, doc.y, {
        width: IC - 32,
        align: "center",
        lineGap: 4,
      });
      doc.moveDown(0.3);
      doc.fillColor(ALTIN).fontSize(11.5).text(`— ${m.ad || "İsimsiz Misafir"}`, KENAR + 16, doc.y, {
        width: IC - 32,
        align: "center",
      });
      doc.moveDown(0.5);
      altinAyrac(doc, doc.y, 70);
      doc.moveDown(1.2);
    }
  }

  // ---- Teşekkür sayfası ----
  yeniSayfa(doc, KREM);
  cerceve(doc, 26);
  doc.fillColor(KAHVE).fontSize(34).text("Teşekkürler", KENAR, doc.page.height / 2 - 70, {
    width: IC,
    align: "center",
  });
  altinAyrac(doc, doc.page.height / 2 - 14);
  doc.fillColor(MUT).fontSize(13).text(
    "Bu özel günümüzde yanımızda olduğunuz ve\nanılarımıza dokunduğunuz için minnettarız.",
    KENAR,
    doc.page.height / 2 + 6,
    { width: IC, align: "center", lineGap: 4 },
  );
  doc.fillColor(ALTIN).fontSize(13).text(g.ciftBaslik, KENAR, doc.page.height / 2 + 80, {
    width: IC,
    align: "center",
    characterSpacing: 1,
  });

  sayfaNumaralari(doc, 1); // kapaktan sonra numaralandır
  doc.end();
  return bitti;
}

// ---- F5: Dijital Albüm PDF ----
export async function albumPdf(album: Album): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margin: 0, bufferPages: true });
  const bitti = topla(doc);
  fontKayit(doc);
  const W = doc.page.width;
  const H = doc.page.height;

  // ---- Kapak (tam sayfa görsel + altın başlık bandı) ----
  const kapakFoto =
    album.fotograflar.find((f) => f.media_id === album.kapak_media_id) ?? album.fotograflar[0];
  const kapakBuf = await gorselBaytlari(kapakFoto?.url ?? null);

  zeminBoya(doc, KAHVE);
  if (kapakBuf) {
    try {
      doc.image(kapakBuf, 0, 0, { cover: [W, H], align: "center", valign: "center" });
    } catch {
      /* atla */
    }
  }
  // Alt karartma bandı (başlık okunsun)
  doc.save();
  doc.fillColor(KAHVE).fillOpacity(0.55);
  doc.rect(0, H - 230, W, 230).fill();
  doc.restore();
  doc.fillColor("#F6EFE2").fontSize(12).text("DÜĞÜN ALBÜMÜ", 0, H - 178, {
    align: "center",
    characterSpacing: 6,
  });
  altinAyrac(doc, H - 150);
  doc.fillColor("#FFFFFF").fontSize(34).text(album.baslik, 50, H - 132, {
    width: W - 100,
    align: "center",
  });
  if (album.published_at) {
    doc.fillColor(ALTIN_ACIK).fontSize(13).text(trTarih(album.published_at), 50, H - 78, {
      width: W - 100,
      align: "center",
      characterSpacing: 2,
    });
  }

  // ---- Bölümlere ayır (hikâye akışı sırasıyla) ----
  const gruplar = new Map<string, AlbumFoto[]>();
  for (const f of album.fotograflar) {
    const b = f.bolum ?? "Diğer";
    const arr = gruplar.get(b);
    if (arr) arr.push(f);
    else gruplar.set(b, [f]);
  }
  // F5 V2: bölüm sırası MÜŞTERİ seçimine göre — her bölümün en küçük 'sira'sı
  // (müşterinin o bölümdeki ilk fotoğrafı) bölüm sırasını belirler. Eşitlikte
  // sabit düzen (BOLUM_DUZEN) ile çözülür.
  const minSira = new Map<string, number>();
  for (const f of album.fotograflar) {
    const b = f.bolum ?? "Diğer";
    const m = minSira.get(b);
    if (m === undefined || f.sira < m) minSira.set(b, f.sira);
  }
  const sirali = [...gruplar.entries()].sort((a, b) => {
    const sa = minSira.get(a[0]) ?? 9999;
    const sb = minSira.get(b[0]) ?? 9999;
    if (sa !== sb) return sa - sb;
    const ia = BOLUM_DUZEN.indexOf(a[0]);
    const ib = BOLUM_DUZEN.indexOf(b[0]);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });

  for (const [bolum, fotolar] of sirali) {
    // Bölüm kapağı (krem + büyük başlık)
    yeniSayfa(doc, KREM);
    cerceve(doc, 26);
    doc.fillColor(ALTIN).fontSize(12).text("BÖLÜM", 0, H / 2 - 70, {
      align: "center",
      characterSpacing: 6,
    });
    doc.fillColor(KAHVE).fontSize(38).text(bolum, 50, H / 2 - 36, {
      width: W - 100,
      align: "center",
    });
    altinAyrac(doc, H / 2 + 24);
    doc.fillColor(MUT).fontSize(11).text(`${fotolar.length} kare`, 50, H / 2 + 36, {
      width: W - 100,
      align: "center",
      characterSpacing: 2,
    });

    // Tam sayfa fotoğraflar (krem zemin + ince altın çerçeve)
    for (const f of fotolar) {
      const buf = await gorselBaytlari(f.url);
      if (!buf) continue;
      yeniSayfa(doc, KREM);
      const m = 42;
      const cw = W - 2 * m;
      const chh = H - 2 * m - 18; // alt sayfa no için pay
      try {
        doc.image(buf, m, m, { fit: [cw, chh], align: "center", valign: "center" });
      } catch {
        continue;
      }
      // ince altın çerçeve (görsel kutusunun kenarında)
      doc.save();
      doc.lineWidth(0.8).strokeColor(ALTIN_ACIK);
      doc.rect(m - 6, m - 6, cw + 12, chh + 12).stroke();
      doc.restore();
    }
  }

  sayfaNumaralari(doc, 1); // kapaktan sonra
  doc.end();
  return bitti;
}

// Kapak (index 0) hariç tüm sayfalara altın sayfa numarası.
function sayfaNumaralari(doc: PDFKit.PDFDocument, baslangicIndex: number) {
  const aralik = doc.bufferedPageRange();
  for (let p = aralik.start; p < aralik.start + aralik.count; p++) {
    if (p - aralik.start < baslangicIndex) continue;
    doc.switchToPage(p);
    const no = p - aralik.start + 1 - baslangicIndex;
    doc.fillColor(ALTIN).fontSize(10).text(
      String(no),
      0,
      doc.page.height - 30,
      { width: doc.page.width, align: "center", characterSpacing: 1 },
    );
  }
}
