"use client";

// =============================================================
// Admin — Medya Merkezi (Özellik 4 revizyonu). Lokal kategori (tekli/toplu/
// video) + KVKK onay linki/durumu + bekleyenleri elle işleme + override.
// Gemini Vision YOK; yüz tespiti sunucuda lokaldir.
// =============================================================
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Loader2,
  Link2,
  Users,
  User,
  Video as VideoIcon,
  RefreshCw,
  ImageDown,
} from "lucide-react";
import { MEDYA_KATEGORILER, kategoriEtiket } from "@/lib/medya/sabit";
import type { MedyaFoto, KategoriDurum } from "@/lib/medya/veri";

type Filtre = "hepsi" | "kategorisiz" | string;

export function MedyaMerkezi({
  eventId,
  eventTitle,
  durumIlk,
  medyalar,
  onayToken,
}: {
  eventId: string;
  eventTitle: string;
  durumIlk: KategoriDurum;
  medyalar: MedyaFoto[];
  onayToken: string | null;
}) {
  const [onay, setOnay] = useState(durumIlk.ai_medya_onay);
  const [kalan, setKalan] = useState(durumIlk.bekleyen);
  const [calisiyor, setCalisiyor] = useState(false);
  const [ilerleme, setIlerleme] = useState<string | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [mesaj, setMesaj] = useState<string | null>(null);
  const [filtre, setFiltre] = useState<Filtre>("hepsi");
  const [kategoriler, setKategoriler] = useState<Record<string, string | null>>(
    Object.fromEntries(medyalar.map((f) => [f.id, f.kategori])),
  );

  function bildir(m: string) {
    setMesaj(m);
    setTimeout(() => setMesaj((x) => (x === m ? null : x)), 2500);
  }

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

  function linkKopyala() {
    if (!onayToken) return;
    const url = `${window.location.origin}/ai-onay/${onayToken}`;
    navigator.clipboard?.writeText(url).then(
      () => bildir("KVKK onay linki kopyalandı."),
      () => bildir(url),
    );
  }

  // Bekleyen (oto_islendi=false) medyaları parti parti işler; ilerleme gösterir.
  async function partiDongusu() {
    let devam = true;
    while (devam) {
      const res = await fetch("/api/admin/medya/analiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.hata ?? "İşlenemedi.");
      setKalan(data.kalan ?? 0);
      setIlerleme(`${data.kategorilenen}/${data.toplam} işlendi`);
      if ((data.kalan ?? 0) <= 0 || (data.islenen ?? 0) === 0) devam = false;
    }
  }

  async function islemeBasla() {
    if (calisiyor) return;
    setCalisiyor(true);
    setHata(null);
    try {
      await partiDongusu();
      window.location.reload();
    } catch (err) {
      setHata(err instanceof Error ? err.message : "Bir hata oluştu.");
      setCalisiyor(false);
    }
  }

  // Eski odalar: kategorisiz kalmış TÜM fotoğrafları yeniden kuyruğa al, sonra işle.
  async function yenidenTara() {
    if (calisiyor) return;
    setCalisiyor(true);
    setHata(null);
    try {
      const res = await fetch("/api/admin/medya/yeniden-tara", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok)
        throw new Error(data.hata ?? "Yeniden tarama başlatılamadı.");
      setKalan(data.kalan ?? 0);
      if ((data.kalan ?? 0) <= 0) {
        bildir("Kategorisiz fotoğraf bulunamadı.");
        setCalisiyor(false);
        return;
      }
      await partiDongusu();
      window.location.reload();
    } catch (err) {
      setHata(err instanceof Error ? err.message : "Bir hata oluştu.");
      setCalisiyor(false);
    }
  }

  // Eski fotoğraflar için thumb/medium türevlerini üret (sharp), parti parti.
  async function thumbnailUret() {
    if (calisiyor) return;
    setCalisiyor(true);
    setHata(null);
    try {
      let devam = true;
      let hicIslendi = false;
      while (devam) {
        const res = await fetch("/api/admin/medya/kucuk-backfill", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok)
          throw new Error(data.hata ?? "Thumbnail üretilemedi.");
        if ((data.islenen ?? 0) > 0) hicIslendi = true;
        setIlerleme(`${data.hazir}/${data.toplam} küçük görsel hazır`);
        if ((data.kalan ?? 0) <= 0 || (data.islenen ?? 0) === 0) devam = false;
      }
      bildir(hicIslendi ? "Thumbnail üretimi tamamlandı." : "Tüm görseller zaten hazır.");
      setCalisiyor(false);
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
    if (filtre === "hepsi") return medyalar;
    if (filtre === "kategorisiz")
      return medyalar.filter((f) => !(kategoriler[f.id] ?? f.kategori));
    return medyalar.filter((f) => (kategoriler[f.id] ?? f.kategori) === filtre);
  }, [filtre, medyalar, kategoriler]);

  const sayac = useMemo(() => {
    const c = { tekli: 0, toplu: 0, video: 0, kategorisiz: 0 };
    for (const f of medyalar) {
      const k = kategoriler[f.id] ?? f.kategori;
      if (k === "tekli") c.tekli++;
      else if (k === "toplu") c.toplu++;
      else if (k === "video") c.video++;
      else c.kategorisiz++;
    }
    return c;
  }, [medyalar, kategoriler]);

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
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                onay ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
              }`}
            >
              {onay ? <ShieldCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
            </span>
            <div className="max-w-xl">
              <p className="text-sm font-semibold">
                KVKK — AI Medya İşleme Onayı{" "}
                {onay ? (
                  <span className="text-emerald-700">✅ Onaylandı</span>
                ) : (
                  <span className="text-amber-700">❌ Onay Bekleniyor</span>
                )}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Fotoğrafların tekli/toplu ayrımı için <strong>sunucuda lokal yüz sayımı</strong>{" "}
                yapılır (hiçbir yere gönderilmez). Onay olmadan fotoğraflar kategorilenmez;
                videolar yine de etiketlenir. Müşteri linkten onaylayabilir.
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
            <span className="text-sm font-medium">Elle {onay ? "kaldır" : "onayla"}</span>
          </label>
        </div>

        {onayToken && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
            <code className="max-w-full truncate rounded-lg bg-muted px-3 py-1.5 text-xs text-foreground/70">
              /ai-onay/{onayToken}
            </code>
            <button
              type="button"
              onClick={linkKopyala}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-xs font-medium text-foreground/70 hover:border-primary hover:text-primary-deep"
            >
              <Link2 className="h-3.5 w-3.5" /> Onay linkini kopyala
            </button>
          </div>
        )}
      </div>

      {/* İşleme aksiyonu */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={islemeBasla}
          disabled={calisiyor || kalan <= 0}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 disabled:opacity-60"
        >
          {calisiyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {kalan > 0 ? `Bekleyenleri Kategorile (${kalan})` : "Bekleyen Yok"}
        </button>
        <button
          type="button"
          onClick={yenidenTara}
          disabled={calisiyor}
          title="Kategorisiz kalmış mevcut fotoğrafları yeniden işle (eski odalar)"
          className="inline-flex items-center gap-2 rounded-full border border-primary/40 px-5 py-2.5 text-sm font-semibold text-primary-deep transition-colors hover:bg-primary-soft/50 disabled:opacity-60"
        >
          {calisiyor ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Mevcut Fotoğrafları Yeniden Tara
        </button>
        <button
          type="button"
          onClick={thumbnailUret}
          disabled={calisiyor}
          title="Eski fotoğraflar için galeri küçük görsellerini (thumb/medium) üret"
          className="inline-flex items-center gap-2 rounded-full border border-primary/40 px-5 py-2.5 text-sm font-semibold text-primary-deep transition-colors hover:bg-primary-soft/50 disabled:opacity-60"
        >
          {calisiyor ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImageDown className="h-4 w-4" />
          )}
          Thumbnail Yeniden Oluştur
        </button>
        <span className="text-sm text-muted-foreground">
          {ilerleme ?? `${durumIlk.kategorilenen}/${durumIlk.toplam} kategorilendi`}
        </span>
        {!onay && (
          <span className="text-xs text-amber-600">
            Onaysız: fotoğraflar kategorilenemez, yalnızca videolar etiketlenir.
          </span>
        )}
      </div>

      {mesaj && (
        <p className="mt-4 inline-block rounded-2xl bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700">
          {mesaj}
        </p>
      )}
      {hata && (
        <p className="mt-4 rounded-2xl bg-rose-soft px-4 py-3 text-sm font-medium text-rose">
          {hata}
        </p>
      )}

      {/* Filtre çubuğu */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <FiltreChip aktif={filtre === "hepsi"} onClick={() => setFiltre("hepsi")}>
          Tümü ({medyalar.length})
        </FiltreChip>
        <FiltreChip aktif={filtre === "tekli"} onClick={() => setFiltre("tekli")}>
          Tekli ({sayac.tekli})
        </FiltreChip>
        <FiltreChip aktif={filtre === "toplu"} onClick={() => setFiltre("toplu")}>
          Toplu ({sayac.toplu})
        </FiltreChip>
        <FiltreChip aktif={filtre === "video"} onClick={() => setFiltre("video")}>
          Video ({sayac.video})
        </FiltreChip>
        <FiltreChip aktif={filtre === "kategorisiz"} onClick={() => setFiltre("kategorisiz")}>
          Kategorisiz ({sayac.kategorisiz})
        </FiltreChip>
      </div>

      {/* Izgara */}
      {medyalar.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">
          Henüz medya yok. Misafirler yükledikçe burada otomatik kategorilenecek.
        </p>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {gosterilen.map((f) => {
            const k = kategoriler[f.id] ?? f.kategori;
            return (
              <div key={f.id} className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="relative aspect-square bg-muted">
                  {f.url ? (
                    f.file_type === "video" ? (
                      <video src={f.url} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={f.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                    )
                  ) : null}
                  <div className="absolute left-2 top-2 flex flex-wrap gap-1">
                    {k && <KategoriRozet kategori={k} />}
                    {!f.oto_islendi && (
                      <span className="rounded-full bg-amber-500/90 px-1.5 py-0.5 text-[10px] font-medium text-white">
                        bekliyor
                      </span>
                    )}
                  </div>
                  {f.file_type === "fotograf" && f.yuz_sayisi != null && (
                    <span className="absolute bottom-2 right-2 inline-flex items-center gap-0.5 rounded-full bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white">
                      <User className="h-3 w-3" /> {f.yuz_sayisi}
                    </span>
                  )}
                </div>
                <div className="p-2">
                  <select
                    value={k ?? ""}
                    onChange={(e) => kategoriAyarla(f.id, e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary"
                  >
                    <option value="">Kategorisiz</option>
                    {MEDYA_KATEGORILER.map((kat) => (
                      <option key={kat.deger} value={kat.deger}>
                        {kat.etiket}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function KategoriRozet({ kategori }: { kategori: string }) {
  const stil =
    kategori === "toplu"
      ? "bg-violet-500/90"
      : kategori === "video"
        ? "bg-sky-600/90"
        : "bg-emerald-600/90";
  const Icon = kategori === "toplu" ? Users : kategori === "video" ? VideoIcon : User;
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full ${stil} px-1.5 py-0.5 text-[10px] font-medium text-white`}>
      <Icon className="h-3 w-3" /> {kategoriEtiket(kategori)}
    </span>
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
