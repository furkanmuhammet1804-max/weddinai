"use client";

// =============================================================
// Admin — AI Medya Merkezi (Özellik 4). KVKK onayı, parti analizi (sharp +
// onaylıysa Gemini Vision kategori), sonuç ızgarası + admin override.
// =============================================================
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  Loader2,
  Moon,
  Droplets,
  Copy,
} from "lucide-react";
import { MEDYA_KATEGORILER } from "@/lib/medya/sabit";
import type { AnalizFoto, AnalizDurum } from "@/lib/medya/veri";

type Filtre = "hepsi" | "bulanik" | "karanlik" | "yinelenen" | string;

export function MedyaMerkezi({
  eventId,
  eventTitle,
  durumIlk,
  fotolar,
}: {
  eventId: string;
  eventTitle: string;
  durumIlk: AnalizDurum;
  fotolar: AnalizFoto[];
}) {
  const [onay, setOnay] = useState(durumIlk.ai_medya_onay);
  const [durum] = useState(durumIlk);
  const [kalan, setKalan] = useState(durumIlk.kalan);
  const [calisiyor, setCalisiyor] = useState(false);
  const [ilerleme, setIlerleme] = useState<string | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [filtre, setFiltre] = useState<Filtre>("hepsi");
  // Yerel kategori override durumu (UI'da anında yansısın).
  const [kategoriler, setKategoriler] = useState<Record<string, string | null>>(
    Object.fromEntries(fotolar.map((f) => [f.id, f.kategori])),
  );

  async function onayDegistir(yeni: boolean) {
    setHata(null);
    try {
      const res = await fetch("/api/admin/medya/onay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, onay: yeni }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.hata ?? "Güncellenemedi.");
      setOnay(yeni);
    } catch (err) {
      setHata(err instanceof Error ? err.message : "Bir hata oluştu.");
    }
  }

  async function analizEt() {
    if (calisiyor) return;
    setCalisiyor(true);
    setHata(null);
    try {
      // Tüm bekleyenler bitene kadar parti parti çalış.
      // (Güvenlik: kategori yalnız KVKK onayı varsa sunucuda gönderilir.)
      let devam = true;
      while (devam) {
        const res = await fetch("/api/admin/medya/analiz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) throw new Error(data.hata ?? "Analiz başarısız.");
        setKalan(data.kalan ?? 0);
        setIlerleme(`${data.analiz_edilen}/${data.toplam} analiz edildi`);
        if ((data.kalan ?? 0) <= 0 || (data.islenen ?? 0) === 0) devam = false;
      }
      // Sonuçları göstermek için sayfayı tazele.
      window.location.reload();
    } catch (err) {
      setHata(err instanceof Error ? err.message : "Bir hata oluştu.");
      setCalisiyor(false);
    }
  }

  async function kategoriAyarla(mediaId: string, kategori: string) {
    const deger = kategori || null;
    setKategoriler((k) => ({ ...k, [mediaId]: deger }));
    try {
      await fetch("/api/admin/medya/sinif", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaId, kategori: deger }),
      });
    } catch {
      /* sessiz geç — sonraki yenilemede sunucu doğrusu görünür */
    }
  }

  const gosterilen = useMemo(() => {
    if (filtre === "hepsi") return fotolar;
    if (filtre === "bulanik") return fotolar.filter((f) => f.bulanik);
    if (filtre === "karanlik") return fotolar.filter((f) => f.karanlik);
    if (filtre === "yinelenen") return fotolar.filter((f) => f.yinelenen);
    return fotolar.filter((f) => (kategoriler[f.id] ?? f.kategori) === filtre);
  }, [filtre, fotolar, kategoriler]);

  const sayac = useMemo(
    () => ({
      bulanik: fotolar.filter((f) => f.bulanik).length,
      karanlik: fotolar.filter((f) => f.karanlik).length,
      yinelenen: fotolar.filter((f) => f.yinelenen).length,
    }),
    [fotolar],
  );

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href="/admin/medya"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Medya Merkezi
      </Link>

      <h1 className="font-display mt-4 text-2xl font-semibold tracking-tight">
        {eventTitle}
      </h1>

      {/* KVKK onay kartı */}
      <div className="mt-5 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary-deep">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div className="max-w-xl">
              <p className="text-sm font-semibold">KVKK — AI Foto Analizi Onayı</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Kategori belirleme için fotoğraflar küçültülerek Gemini&apos;ye
                gönderilir. Onay olmadan <strong>hiçbir fotoğraf</strong> AI&apos;ya
                gönderilmez; yalnızca cihazda (sunucuda) bulanık/karanlık/yinelenen
                analizi yapılır.
              </p>
            </div>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={onay}
              onChange={(e) => onayDegistir(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            <span className="text-sm font-medium">{onay ? "Onaylı" : "Onaysız"}</span>
          </label>
        </div>
      </div>

      {/* Analiz aksiyonu */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={analizEt}
          disabled={calisiyor}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 disabled:opacity-60"
        >
          {calisiyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {kalan > 0 ? `Analiz Et (${kalan} bekliyor)` : "Yeniden Analiz Yok"}
        </button>
        <span className="text-sm text-muted-foreground">
          {ilerleme ?? `${durum.analiz_edilen}/${durum.toplam_foto} analiz edildi`}
        </span>
        {!onay && (
          <span className="text-xs text-amber-600">
            Onaysız: kategori belirlenmez, yalnızca kalite analizi yapılır.
          </span>
        )}
      </div>

      {hata && (
        <p className="mt-4 rounded-2xl bg-rose-soft px-4 py-3 text-sm font-medium text-rose">
          {hata}
        </p>
      )}

      {/* Filtre çubuğu */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <FiltreChip aktif={filtre === "hepsi"} onClick={() => setFiltre("hepsi")}>
          Tümü ({fotolar.length})
        </FiltreChip>
        {MEDYA_KATEGORILER.map((k) => (
          <FiltreChip key={k.deger} aktif={filtre === k.deger} onClick={() => setFiltre(k.deger)}>
            {k.etiket}
          </FiltreChip>
        ))}
        <FiltreChip aktif={filtre === "bulanik"} onClick={() => setFiltre("bulanik")}>
          Bulanık ({sayac.bulanik})
        </FiltreChip>
        <FiltreChip aktif={filtre === "karanlik"} onClick={() => setFiltre("karanlik")}>
          Karanlık ({sayac.karanlik})
        </FiltreChip>
        <FiltreChip aktif={filtre === "yinelenen"} onClick={() => setFiltre("yinelenen")}>
          Yinelenen ({sayac.yinelenen})
        </FiltreChip>
      </div>

      {/* Izgara */}
      {fotolar.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">
          Henüz analiz edilmiş fotoğraf yok. Yukarıdan analizi başlatın.
        </p>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {gosterilen.map((f) => (
            <div key={f.id} className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="relative aspect-square bg-muted">
                {f.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : null}
                <div className="absolute left-2 top-2 flex flex-wrap gap-1">
                  {f.bulanik && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/90 px-1.5 py-0.5 text-[10px] font-medium text-white">
                      <Droplets className="h-3 w-3" /> Bulanık
                    </span>
                  )}
                  {f.karanlik && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-slate-700/90 px-1.5 py-0.5 text-[10px] font-medium text-white">
                      <Moon className="h-3 w-3" /> Karanlık
                    </span>
                  )}
                  {f.yinelenen && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-rose/90 px-1.5 py-0.5 text-[10px] font-medium text-white">
                      <Copy className="h-3 w-3" /> Yinelenen
                    </span>
                  )}
                </div>
                {f.kalite_skor != null && (
                  <span className="absolute bottom-2 right-2 rounded-full bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    {f.kalite_skor}
                  </span>
                )}
              </div>
              <div className="p-2">
                <select
                  value={kategoriler[f.id] ?? ""}
                  onChange={(e) => kategoriAyarla(f.id, e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary"
                >
                  <option value="">Kategori yok</option>
                  {MEDYA_KATEGORILER.map((k) => (
                    <option key={k.deger} value={k.deger}>
                      {k.etiket}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FiltreChip({
  aktif,
  onClick,
  children,
}: {
  aktif: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={aktif}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        aktif
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border text-foreground/70 hover:border-primary/40"
      }`}
    >
      {children}
    </button>
  );
}
