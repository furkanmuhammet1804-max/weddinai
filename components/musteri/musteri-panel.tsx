"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Images,
  PenLine,
  LogOut,
  Sparkles,
  Star,
  Loader2,
  Video as VideoIcon,
  Mic,
  Camera,
  CheckCircle2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { OdaBilgi, OdaMedya, OdaAni } from "@/lib/oda/veri";
import { turEtiket, tarihTR } from "@/lib/etkinlik";

type Sekme = "anilar" | "defter";

export function MusteriPanel({
  slug,
  bilgi,
  medyalar,
  anilar,
}: {
  slug: string;
  bilgi: OdaBilgi;
  medyalar: OdaMedya[];
  anilar: OdaAni[];
}) {
  const router = useRouter();
  const [sekme, setSekme] = useState<Sekme>("anilar");
  const [liste, setListe] = useState<OdaMedya[]>(medyalar);
  const [cikis, setCikis] = useState(false);

  const fotoSayi = liste.filter((m) => m.file_type === "fotograf").length;
  const videoSayi = liste.filter((m) => m.file_type === "video").length;
  const showroomSayi = liste.filter((m) => m.showroom_approved).length;

  async function cikisYap() {
    if (cikis) return;
    setCikis(true);
    try {
      await fetch("/api/oda/cikis", { method: "POST" });
    } catch {
      /* yine de yönlendir */
    }
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Üst bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-3.5 sm:px-8">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-deep">
              <Sparkles className="h-3 w-3" /> {turEtiket(bilgi.event_type)}
              {bilgi.event_date ? ` · ${tarihTR(bilgi.event_date)}` : ""}
            </p>
            <h1 className="font-display truncate text-lg font-semibold tracking-tight">
              {bilgi.title}
            </h1>
          </div>
          <button
            type="button"
            onClick={cikisYap}
            disabled={cikis}
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground/70 transition-colors hover:border-primary hover:text-primary disabled:opacity-60"
          >
            {cikis ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            Çıkış
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-7 sm:px-8">
        {/* İstatistik */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <Istatistik icon={Camera} deger={fotoSayi} etiket="Fotoğraf" />
          <Istatistik icon={VideoIcon} deger={videoSayi} etiket="Video" />
          <Istatistik icon={PenLine} deger={anilar.length} etiket="Anı Notu" />
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary-soft/40 px-4 py-3 text-sm text-primary-deep">
          <Star className="h-4 w-4 shrink-0" />
          <p>
            <span className="font-semibold">{showroomSayi}</span> fotoğraf
            showroom&apos;da yayında. Beğendiğin fotoğrafları{" "}
            <span className="font-medium">&quot;Showroom&apos;da Yayınla&quot;</span>{" "}
            ile vitrine ekleyebilirsin.
          </p>
        </div>

        {/* Sekmeler */}
        <div className="mt-6 flex gap-1 border-b border-border">
          <SekmeDugme
            aktif={sekme === "anilar"}
            onClick={() => setSekme("anilar")}
            icon={Images}
            etiket={`Anılar (${liste.length})`}
          />
          <SekmeDugme
            aktif={sekme === "defter"}
            onClick={() => setSekme("defter")}
            icon={PenLine}
            etiket={`Anı Defteri (${anilar.length})`}
          />
        </div>

        <div className="mt-6">
          <AnimatePresence mode="wait">
            {sekme === "anilar" ? (
              <motion.div
                key="anilar"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
              >
                {liste.length === 0 ? (
                  <BosDurum
                    icon={Images}
                    baslik="Henüz içerik yok"
                    aciklama="Misafirler QR ile yükleme yaptıkça fotoğraf ve videolar burada belirir."
                  />
                ) : (
                  <div className="columns-2 gap-4 [column-fill:_balance] sm:columns-3 lg:columns-4">
                    {liste.map((m) => (
                      <MedyaKart
                        key={m.id}
                        slug={slug}
                        medya={m}
                        onDegis={(onay) =>
                          setListe((o) =>
                            o.map((x) =>
                              x.id === m.id
                                ? { ...x, showroom_approved: onay }
                                : x,
                            ),
                          )
                        }
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="defter"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="space-y-3"
              >
                {anilar.length === 0 ? (
                  <BosDurum
                    icon={PenLine}
                    baslik="Henüz anı notu yok"
                    aciklama="Misafirlerin bıraktığı yazılı ve sesli anılar burada toplanır."
                  />
                ) : (
                  anilar.map((a) => <AniKart key={a.id} ani={a} />)
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function Istatistik({
  icon: Icon,
  deger,
  etiket,
}: {
  icon: typeof Camera;
  deger: number;
  etiket: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-sm">
      <Icon className="mx-auto h-5 w-5 text-primary" />
      <p className="font-display mt-2 text-2xl font-semibold">{deger}</p>
      <p className="text-xs text-muted-foreground">{etiket}</p>
    </div>
  );
}

function SekmeDugme({
  aktif,
  onClick,
  icon: Icon,
  etiket,
}: {
  aktif: boolean;
  onClick: () => void;
  icon: typeof Images;
  etiket: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
        aktif ? "text-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="h-4 w-4" />
      {etiket}
      {aktif && (
        <motion.span
          layoutId="musteri-sekme"
          className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary"
        />
      )}
    </button>
  );
}

function MedyaKart({
  slug,
  medya,
  onDegis,
}: {
  slug: string;
  medya: OdaMedya;
  onDegis: (onay: boolean) => void;
}) {
  const [kaydediyor, setKaydediyor] = useState(false);
  const [hata, setHata] = useState(false);

  async function toggle() {
    if (kaydediyor) return;
    const yeni = !medya.showroom_approved;
    setKaydediyor(true);
    setHata(false);
    onDegis(yeni); // iyimser güncelleme
    try {
      const res = await fetch("/api/oda/showroom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, mediaId: medya.id, onay: yeni }),
      });
      if (!res.ok) throw new Error();
    } catch {
      onDegis(!yeni); // geri al
      setHata(true);
    } finally {
      setKaydediyor(false);
    }
  }

  return (
    <div className="mb-4 break-inside-avoid overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="relative bg-muted">
        {medya.url ? (
          medya.file_type === "video" ? (
            <video
              src={medya.url}
              controls
              playsInline
              className="w-full"
              preload="metadata"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={medya.url}
              alt={medya.guest_name ?? "Anı"}
              loading="lazy"
              className="w-full object-cover"
            />
          )
        ) : (
          <div className="flex aspect-square items-center justify-center text-muted-foreground">
            <Camera className="h-6 w-6" />
          </div>
        )}
        {medya.file_type === "video" && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur">
            <VideoIcon className="h-3 w-3" /> Video
          </span>
        )}
      </div>
      <div className="p-3">
        {medya.guest_name && (
          <p className="truncate text-xs text-muted-foreground">
            {medya.guest_name}
          </p>
        )}
        <button
          type="button"
          onClick={toggle}
          disabled={kaydediyor}
          className={`mt-2 flex w-full items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60 ${
            medya.showroom_approved
              ? "bg-primary text-primary-foreground"
              : "border border-primary/40 text-primary-deep hover:bg-primary-soft/50"
          }`}
        >
          {kaydediyor ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : medya.showroom_approved ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <Star className="h-3.5 w-3.5" />
          )}
          {medya.showroom_approved ? "Showroom'da yayında" : "Showroom'da Yayınla"}
        </button>
        {hata && (
          <p className="mt-1 text-center text-[11px] text-rose">
            Kaydedilemedi, tekrar deneyin.
          </p>
        )}
      </div>
    </div>
  );
}

function AniKart({ ani }: { ani: OdaAni }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <p className="font-display font-semibold">
        {ani.guest_name ?? "İsimsiz misafir"}
      </p>
      {ani.message_text && (
        <p className="mt-2 text-sm leading-relaxed text-foreground/80">
          {ani.message_text}
        </p>
      )}
      {ani.audio_url && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-muted px-3 py-2">
          <Mic className="h-4 w-4 shrink-0 text-primary" />
          <audio src={ani.audio_url} controls className="h-8 w-full" />
        </div>
      )}
    </div>
  );
}

function BosDurum({
  icon: Icon,
  baslik,
  aciklama,
}: {
  icon: typeof Images;
  baslik: string;
  aciklama: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card/50 p-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="font-display mt-4 text-lg font-semibold">{baslik}</h3>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
        {aciklama}
      </p>
    </div>
  );
}
