// =============================================================
// POST /api/admin/hatira/uret  —  AI Hatıra Defteri taslağı üret (Özellik 3)
//
// YALNIZCA ADMIN (§7). Etkinliğin misafir MESAJLARINDAN bir taslak üretir,
// AES-256 şifreli olarak 'taslak' durumunda kaydeder. Otomatik yayın YOK.
// Maliyet ai_islem_log'a (PII-siz) yazılır.
// =============================================================
import { NextResponse } from "next/server";
import { adminOturumGecerli } from "@/lib/admin/oturum";
import { metinUret, VARSAYILAN_MODEL } from "@/lib/ai/provider";
import { hatiraDefteriPrompt } from "@/lib/ai/prompts";
import { aiLogKaydet } from "@/lib/ai/logger";
import { sifrelemeHazirMi } from "@/lib/guvenlik/sifrele";
import { hatiraUretSema } from "@/lib/hatira/sema";
import { etkinlikMesajlari, hatiraTaslakKaydet } from "@/lib/hatira/veri";
import { odaBilgiId } from "@/lib/oda/veri";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await adminOturumGecerli())) {
    return NextResponse.json({ ok: false, hata: "Yetki yok." }, { status: 401 });
  }
  if (!sifrelemeHazirMi()) {
    return NextResponse.json(
      { ok: false, hata: "Şifreleme anahtarı (APP_ENCRYPTION_KEY) yapılandırılmamış." },
      { status: 500 },
    );
  }

  let ham: unknown;
  try {
    ham = await request.json();
  } catch {
    return NextResponse.json({ ok: false, hata: "Geçersiz istek." }, { status: 400 });
  }
  const ayris = hatiraUretSema.safeParse(ham);
  if (!ayris.success) {
    return NextResponse.json({ ok: false, hata: "Etkinlik kimliği gerekli." }, { status: 400 });
  }
  const { eventId } = ayris.data;

  const bilgi = await odaBilgiId(eventId);
  if (!bilgi) {
    return NextResponse.json({ ok: false, hata: "Etkinlik bulunamadı." }, { status: 404 });
  }

  const mesajlar = await etkinlikMesajlari(eventId);
  const baslangic = Date.now();
  try {
    const { system, user } = hatiraDefteriPrompt({
      etkinlikBaslik: bilgi.title,
      mesajlar,
    });
    // Yaratıcılık: doğal, klişesiz anlatı için yüksek ama dengeli sıcaklık.
    const sonuc = await metinUret({
      system,
      user,
      maxTokens: 2048,
      temperature: 0.95,
      topP: 0.97,
    });
    const icerik = sonuc.metin.trim();
    if (!icerik) {
      await aiLogKaydet({
        islemTip: "hatira-defteri",
        model: sonuc.model,
        basari: false,
        hata: "Boş yanıt",
        girdiOzet: { mesaj_sayisi: mesajlar.length },
        inputToken: sonuc.inputToken,
        outputToken: sonuc.outputToken,
        sureMs: Date.now() - baslangic,
      });
      return NextResponse.json({ ok: false, hata: "Taslak üretilemedi." }, { status: 502 });
    }

    const id = await hatiraTaslakKaydet(
      eventId,
      `${bilgi.title} — Hatıra Defteri`,
      icerik,
      { mesaj_sayisi: mesajlar.length, uretildi: new Date().toISOString() },
    );

    await aiLogKaydet({
      islemTip: "hatira-defteri",
      model: sonuc.model,
      basari: !!id,
      girdiOzet: { mesaj_sayisi: mesajlar.length },
      ciktiOzet: { karakter: icerik.length },
      inputToken: sonuc.inputToken,
      outputToken: sonuc.outputToken,
      sureMs: Date.now() - baslangic,
    });

    if (!id) {
      return NextResponse.json({ ok: false, hata: "Kaydedilemedi." }, { status: 500 });
    }
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    const mesaj = err instanceof Error ? err.message : "Bilinmeyen hata";
    await aiLogKaydet({
      islemTip: "hatira-defteri",
      model: VARSAYILAN_MODEL,
      basari: false,
      hata: mesaj,
      girdiOzet: { mesaj_sayisi: mesajlar.length },
      sureMs: Date.now() - baslangic,
    });
    return NextResponse.json(
      { ok: false, hata: "AI servisi şu an yanıt veremedi." },
      { status: 500 },
    );
  }
}
