// =============================================================
// POST /api/admin/medya/analiz — bir parti fotoğrafı analiz et (Özellik 4).
// YALNIZCA ADMIN. Lokal (sharp): bulanık/karanlık/kalite/phash — her zaman.
// Kategori (Gemini Vision): YALNIZCA events.ai_medya_onay = true ise (§6).
// Büyük odalarda parti parti çalışır; "kalan" döner → admin "Devam et" der.
// =============================================================
import { NextResponse } from "next/server";
import { adminOturumGecerli } from "@/lib/admin/oturum";
import { gorselSinifla } from "@/lib/ai/provider";
import { aiLogKaydet } from "@/lib/ai/logger";
import { gorselMetrik, kucukJpeg } from "@/lib/medya/analiz";
import { medyaAnalizSema } from "@/lib/medya/sema";
import { KATEGORI_DEGERLER, ANALIZ_PARTI_BOYUT } from "@/lib/medya/sabit";
import {
  etkinlikOnayDurum,
  bekleyenFotograflar,
  fotoBaytlari,
  analizKaydet,
  analizDurum,
} from "@/lib/medya/veri";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Parti işleme uzun sürebilir; süreyi yükselt (Vercel'de plan limitine tabi).
export const maxDuration = 300;

export async function POST(request: Request) {
  if (!(await adminOturumGecerli())) {
    return NextResponse.json({ ok: false, hata: "Yetki yok." }, { status: 401 });
  }
  let ham: unknown;
  try {
    ham = await request.json();
  } catch {
    return NextResponse.json({ ok: false, hata: "Geçersiz istek." }, { status: 400 });
  }
  const ayris = medyaAnalizSema.safeParse(ham);
  if (!ayris.success) {
    return NextResponse.json({ ok: false, hata: "Etkinlik kimliği gerekli." }, { status: 400 });
  }
  const { eventId } = ayris.data;

  const onay = await etkinlikOnayDurum(eventId);
  const parti = await bekleyenFotograflar(eventId, ANALIZ_PARTI_BOYUT);

  let islenen = 0;
  let kategorilenen = 0;
  let inputToken = 0;
  let outputToken = 0;
  let model = "";
  const baslangic = Date.now();

  for (const foto of parti) {
    try {
      const bytlar = await fotoBaytlari(foto.storage_path);
      if (!bytlar) {
        // İndirilemedi → tekrar denememek için analiz edildi say (güvenli varsayılan).
        await analizKaydet(foto.id, {
          bulanik: false,
          karanlik: false,
          kaliteSkor: 0,
          phash: "",
        });
        islenen++;
        continue;
      }

      const metrik = await gorselMetrik(bytlar.buf);

      // Kategori — YALNIZCA KVKK onayı varsa Gemini Vision'a gönder (§6).
      let kategori: string | null = null;
      if (onay) {
        try {
          const kucuk = await kucukJpeg(bytlar.buf);
          const v = await gorselSinifla({
            imageBase64: kucuk.toString("base64"),
            mimeType: "image/jpeg",
            kategoriler: KATEGORI_DEGERLER,
          });
          kategori = v.kategori;
          inputToken += v.inputToken;
          outputToken += v.outputToken;
          model = v.model;
          if (kategori) kategorilenen++;
        } catch {
          /* vision hatası → kategori null; lokal analiz yine de kaydedilir */
        }
      }

      await analizKaydet(foto.id, { ...metrik, kategori });
      islenen++;
    } catch {
      // Bozuk görsel vb. → analiz edildi say, varsayılanlarla.
      await analizKaydet(foto.id, {
        bulanik: false,
        karanlik: false,
        kaliteSkor: 0,
        phash: "",
      });
      islenen++;
    }
  }

  // Maliyet/iz: tek satır, PII-siz (yalnız sayılar).
  if (onay && (inputToken > 0 || outputToken > 0 || kategorilenen > 0)) {
    await aiLogKaydet({
      islemTip: "medya-kategori",
      model: model || "gemini-2.5-flash",
      basari: true,
      girdiOzet: { foto: islenen, onay: true },
      ciktiOzet: { kategorilenen },
      inputToken,
      outputToken,
      sureMs: Date.now() - baslangic,
    });
  }

  const durum = await analizDurum(eventId);
  return NextResponse.json({
    ok: true,
    islenen,
    kategorilenen,
    onay,
    kalan: durum.kalan,
    analiz_edilen: durum.analiz_edilen,
    toplam: durum.toplam_foto,
  });
}
