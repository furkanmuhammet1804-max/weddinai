"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  Download,
  CheckSquare,
  Square,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import JSZip from "jszip";
import type { OdaBilgi, OdaMedya, OdaAni } from "@/lib/oda/veri";
import { turEtiket, tarihTR } from "@/lib/etkinlik";

type Sekme = "anilar" | "defter";

// Mobilde akıcı kalsın diye medya kartları parça parça (lazy) gösterilir.
const GOSTER_ADIM = 48;

// Bir medyanın indirme dosya adını üretir (sıra-no + isim + uzantı).
function dosyaAdi(m: OdaMedya, i: number): string {
  let ext = m.file_type === "video" ? "mp4" : "jpg";
  try {
    const p = new URL(m.url ?? "").pathname;
    const nokta = p.lastIndexOf(".");
    if (nokta >= 0) {
      const e = p.slice(nokta + 1).toLowerCase();
      if (/^[a-z0-9]{2,5}$/.test(e)) ext = e;
    }
  } catch {
    /* yoksay */
  }
  const ad =
    (m.guest_name ?? "ani")
      .replace(/[^\p{L}\p{N} _-]/gu, "")
      .trim()
      .slice(0, 30) || "ani";
  return `${String(i + 1).padStart(3, "0")}-${ad}.${ext}`;
}

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
  const [yenileniyor, setYenileniyor] = useState(false);

  // Seçim & indirme & lightbox
  const [secimModu, setSecimModu] = useState(false);
  const [secili, setSecili] = useState<Set<string>>(new Set());
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [indirme, setIndirme] = useState<{
    yapilan: number;
    toplam: number;
  } | null>(null);
  const [gosterilen, setGosterilen] = useState(GOSTER_ADIM);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Props değişince (router.refresh sonrası) listeyi tazele
  useEffect(() => {
    setListe(medyalar);
    setGosterilen(GOSTER_ADIM);
  }, [medyalar]);

  // Sonsuz kaydırma: sentinel görününce daha fazla kart yükle.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (girisler) => {
        if (girisler[0]?.isIntersecting) {
          setGosterilen((g) => Math.min(g + GOSTER_ADIM, liste.length));
        }
      },
      { rootMargin: "600px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [liste.length, sekme]);

  // Seçilen içerikleri toplu siler.
  async function topluSil(medias: OdaMedya[]) {
    if (medias.length === 0) return;
    if (
      !window.confirm(
        `${medias.length} içeriği kalıcı olarak silmek istiyor musunuz? Bu işlem geri alınamaz.`,
      )
    )
      return;
    const idSet = new Set(medias.map((m) => m.id));
    setListe((o) => o.filter((x) => !idSet.has(x.id))); // iyimser
    setSecili(new Set());
    setSecimModu(false);
    try {
      const res = await fetch("/api/oda/medya-sil", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, mediaIds: [...idSet] }),
      });
      if (!res.ok) throw new Error();
    } catch {
      router.refresh();
    }
  }

  // Müşteri bir içeriği siler (depolama dosyası da temizlenir).
  async function silMedya(m: OdaMedya) {
    if (
      !window.confirm(
        "Bu içeriği kalıcı olarak silmek istiyor musunuz? Bu işlem geri alınamaz.",
      )
    )
      return;
    setListe((o) => o.filter((x) => x.id !== m.id)); // iyimser
    try {
      const res = await fetch("/api/oda/medya-sil", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, mediaId: m.id }),
      });
      if (!res.ok) throw new Error();
    } catch {
      router.refresh(); // başarısızsa gerçeği geri getir
    }
  }

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

  function yenile() {
    if (yenileniyor) return;
    setYenileniyor(true);
    router.refresh();
    // Görsel geri bildirim için kısa süre sonra kapat
    setTimeout(() => setYenileniyor(false), 1200);
  }

  // ---- İndirme ----
  const tekBlobIndir = useCallback(async (m: OdaMedya, i: number) => {
    if (!m.url) return;
    const res = await fetch(m.url);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = dosyaAdi(m, i);
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, []);

  const tekIndir = useCallback(
    async (m: OdaMedya, i: number) => {
      setIndirme({ yapilan: 0, toplam: 1 });
      try {
        await tekBlobIndir(m, i);
      } catch {
        /* sessiz */
      }
      setIndirme(null);
    },
    [tekBlobIndir],
  );

  const topluIndir = useCallback(
    async (medias: OdaMedya[]) => {
      const indirilecek = medias.filter((m) => m.url);
      if (indirilecek.length === 0) return;
      // Tek dosyaysa düz indir (zip'e gerek yok).
      if (indirilecek.length === 1) {
        await tekIndir(indirilecek[0], 0);
        return;
      }
      setIndirme({ yapilan: 0, toplam: indirilecek.length });
      try {
        const zip = new JSZip();
        for (let i = 0; i < indirilecek.length; i++) {
          const m = indirilecek[i];
          try {
            const res = await fetch(m.url!);
            zip.file(dosyaAdi(m, i), await res.blob());
          } catch {
            /* o dosyayı atla */
          }
          setIndirme({ yapilan: i + 1, toplam: indirilecek.length });
        }
        const blob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${slug}-anilar.zip`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch {
        /* sessiz */
      }
      setIndirme(null);
    },
    [slug, tekIndir],
  );

  function secimToggle(id: string) {
    setSecili((o) => {
      const y = new Set(o);
      if (y.has(id)) y.delete(id);
      else y.add(id);
      return y;
    });
  }

  function tumunuSec() {
    setSecili(new Set(liste.map((m) => m.id)));
  }
  function secimiTemizle() {
    setSecili(new Set());
  }
  function secimModuKapat() {
    setSecimModu(false);
    setSecili(new Set());
  }

  const seciliMedyalar = liste.filter((m) => secili.has(m.id));

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
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={yenile}
              disabled={yenileniyor}
              title="Yeni yüklemeleri getir"
              className="inline-flex items-center gap-2 rounded-full border border-border px-3.5 py-2 text-sm font-medium text-foreground/70 transition-colors hover:border-primary hover:text-primary disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${yenileniyor ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">Yenile</span>
            </button>
            <button
              type="button"
              onClick={cikisYap}
              disabled={cikis}
              className="inline-flex items-center gap-2 rounded-full border border-border px-3.5 py-2 text-sm font-medium text-foreground/70 transition-colors hover:border-primary hover:text-primary disabled:opacity-60"
            >
              {cikis ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Çıkış</span>
            </button>
          </div>
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
            <span className="font-semibold">{showroomSayi}</span>{" "}
            fotoğraf showroom&apos;da yayında. Fotoğrafa tıklayıp büyütebilir, tek tek ya
            da toplu indirebilirsin.
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

        <div className="mt-5">
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
                    aciklama="Misafirler QR ile yükleme yaptıkça fotoğraf ve videolar burada belirir. Yeni yüklemeleri görmek için Yenile'ye dokun."
                  />
                ) : (
                  <>
                    {/* Araç çubuğu */}
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm text-muted-foreground">
                        {liste.length} içerik
                      </p>
                      <div className="flex items-center gap-2">
                        {!secimModu ? (
                          <>
                            <button
                              type="button"
                              onClick={() => topluIndir(liste)}
                              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-sm font-medium hover:border-primary hover:text-primary"
                            >
                              <Download className="h-4 w-4" /> Tümünü indir
                            </button>
                            <button
                              type="button"
                              onClick={() => setSecimModu(true)}
                              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground hover:brightness-110"
                            >
                              <CheckSquare className="h-4 w-4" /> Seç
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={
                                secili.size === liste.length
                                  ? secimiTemizle
                                  : tumunuSec
                              }
                              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-sm font-medium hover:border-primary hover:text-primary"
                            >
                              {secili.size === liste.length
                                ? "Seçimi kaldır"
                                : "Tümünü seç"}
                            </button>
                            <button
                              type="button"
                              onClick={secimModuKapat}
                              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-sm font-medium hover:border-primary hover:text-primary"
                            >
                              <X className="h-4 w-4" /> Vazgeç
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="columns-2 gap-4 [column-fill:_balance] sm:columns-3 lg:columns-4">
                      {liste.slice(0, gosterilen).map((m, i) => (
                        <MedyaKart
                          key={m.id}
                          slug={slug}
                          medya={m}
                          secimModu={secimModu}
                          secili={secili.has(m.id)}
                          onAc={() => setLightbox(i)}
                          onSecim={() => secimToggle(m.id)}
                          onIndir={() => tekIndir(m, i)}
                          onSil={() => silMedya(m)}
                          onShowroom={(onay) =>
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
                    {gosterilen < liste.length && (
                      <div
                        ref={sentinelRef}
                        className="flex justify-center py-6"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setGosterilen((g) =>
                              Math.min(g + GOSTER_ADIM, liste.length),
                            )
                          }
                          className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium hover:border-primary hover:text-primary"
                        >
                          Daha fazla göster ({liste.length - gosterilen})
                        </button>
                      </div>
                    )}
                  </>
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

      {/* Seçim alt çubuğu */}
      <AnimatePresence>
        {secimModu && (
          <motion.div
            initial={{ y: 80 }}
            animate={{ y: 0 }}
            exit={{ y: 80 }}
            className="sticky bottom-0 z-30 border-t border-border bg-card/90 backdrop-blur-md"
          >
            <div
              className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 pt-3 sm:px-8"
              style={{
                paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))",
              }}
            >
              <p className="text-sm font-medium">{secili.size} seçili</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={secili.size === 0}
                  onClick={() => topluSil(seciliMedyalar)}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-elegant hover:brightness-110 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Sil
                </button>
                <button
                  type="button"
                  disabled={secili.size === 0}
                  onClick={() => topluIndir(seciliMedyalar)}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-elegant hover:brightness-110 disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                  İndir
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox !== null && liste[lightbox] && (
          <Lightbox
            liste={liste}
            index={lightbox}
            onKapat={() => setLightbox(null)}
            onGit={(i) => setLightbox(i)}
            onIndir={(m, i) => tekIndir(m, i)}
          />
        )}
      </AnimatePresence>

      {/* İndirme ilerleme overlay */}
      <AnimatePresence>
        {indirme && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm"
          >
            <div className="rounded-2xl bg-card px-8 py-6 text-center shadow-elegant">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
              <p className="font-display mt-3 font-semibold">İndiriliyor…</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {indirme.yapilan} / {indirme.toplam} hazırlanıyor
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ----------------------- Lightbox ----------------------- */
function Lightbox({
  liste,
  index,
  onKapat,
  onGit,
  onIndir,
}: {
  liste: OdaMedya[];
  index: number;
  onKapat: () => void;
  onGit: (i: number) => void;
  onIndir: (m: OdaMedya, i: number) => void;
}) {
  const m = liste[index];
  const onceki = () => onGit((index - 1 + liste.length) % liste.length);
  const sonraki = () => onGit((index + 1) % liste.length);

  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if (e.key === "Escape") onKapat();
      else if (e.key === "ArrowLeft") onceki();
      else if (e.key === "ArrowRight") sonraki();
    };
    window.addEventListener("keydown", f);
    const eski = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", f);
      document.body.style.overflow = eski;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, liste.length]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-sm"
      onClick={onKapat}
    >
      {/* Üst bar */}
      <div
        className="flex items-center justify-between gap-3 px-4 pb-3 text-white"
        style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-sm text-white/70">
          {index + 1} / {liste.length}
          {m.guest_name ? ` · ${m.guest_name}` : ""}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onIndir(m, index)}
            className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium hover:bg-white/25"
          >
            <Download className="h-4 w-4" /> İndir
          </button>
          <button
            type="button"
            onClick={onKapat}
            aria-label="Kapat"
            className="rounded-full bg-white/15 p-2 hover:bg-white/25"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* İçerik */}
      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden px-2 pb-6"
        onClick={(e) => e.stopPropagation()}
      >
        {liste.length > 1 && (
          <button
            type="button"
            onClick={onceki}
            aria-label="Önceki"
            className="absolute left-2 z-10 rounded-full bg-white/15 p-2 text-white hover:bg-white/25 sm:left-4"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {m.url ? (
          m.file_type === "video" ? (
            <video
              src={m.url}
              controls
              autoPlay
              playsInline
              className="max-h-full max-w-full rounded-lg"
            />
          ) : (
            <motion.img
              key={index}
              src={m.url}
              alt={m.guest_name ?? "Anı"}
              drag={liste.length > 1 ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.18}
              onDragEnd={(_, info) => {
                if (info.offset.x < -80) sonraki();
                else if (info.offset.x > 80) onceki();
              }}
              initial={{ opacity: 0.4 }}
              animate={{ opacity: 1 }}
              className="max-h-full max-w-full touch-pan-y rounded-lg object-contain"
            />
          )
        ) : (
          <div className="text-white/60">Görsel yüklenemedi</div>
        )}

        {liste.length > 1 && (
          <button
            type="button"
            onClick={sonraki}
            aria-label="Sonraki"
            className="absolute right-2 z-10 rounded-full bg-white/15 p-2 text-white hover:bg-white/25 sm:right-4"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>
    </motion.div>
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
  secimModu,
  secili,
  onAc,
  onSecim,
  onIndir,
  onSil,
  onShowroom,
}: {
  slug: string;
  medya: OdaMedya;
  secimModu: boolean;
  secili: boolean;
  onAc: () => void;
  onSecim: () => void;
  onIndir: () => void;
  onSil: () => void;
  onShowroom: (onay: boolean) => void;
}) {
  const [kaydediyor, setKaydediyor] = useState(false);

  async function showroomToggle(e: React.MouseEvent) {
    e.stopPropagation();
    if (kaydediyor) return;
    const yeni = !medya.showroom_approved;
    setKaydediyor(true);
    onShowroom(yeni);
    try {
      const res = await fetch("/api/oda/showroom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, mediaId: medya.id, onay: yeni }),
      });
      if (!res.ok) throw new Error();
    } catch {
      onShowroom(!yeni);
    } finally {
      setKaydediyor(false);
    }
  }

  return (
    <div
      className={`group mb-4 break-inside-avoid overflow-hidden rounded-2xl border bg-card shadow-sm transition-all ${
        secili ? "border-primary ring-2 ring-primary" : "border-border"
      }`}
    >
      <button
        type="button"
        onClick={secimModu ? onSecim : onAc}
        className="relative block w-full bg-muted text-left"
      >
        {medya.url ? (
          medya.file_type === "video" ? (
            <video
              src={medya.url}
              playsInline
              muted
              preload="metadata"
              className="w-full"
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

        {/* Seçim göstergesi */}
        {secimModu && (
          <span
            className={`absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 ${
              secili
                ? "border-primary bg-primary text-primary-foreground"
                : "border-white bg-black/30 text-transparent"
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
          </span>
        )}

        {/* İndir (görüntüleme modunda, hover'da) */}
        {!secimModu && (
          <span
            role="button"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              onIndir();
            }}
            className="absolute right-2 top-2 hidden rounded-full bg-black/40 p-1.5 text-white backdrop-blur transition-colors hover:bg-black/60 group-hover:block"
            aria-label="İndir"
          >
            <Download className="h-4 w-4" />
          </span>
        )}
      </button>

      <div className="p-3">
        {medya.guest_name && (
          <p className="truncate text-xs text-muted-foreground">
            {medya.guest_name}
          </p>
        )}
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={showroomToggle}
            disabled={kaydediyor || secimModu}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
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
            {medya.showroom_approved ? "Yayında" : "Showroom'da Yayınla"}
          </button>
          {!secimModu && (
            <button
              type="button"
              onClick={onSil}
              aria-label="Sil"
              title="Sil"
              className="shrink-0 rounded-full border border-rose/40 p-2 text-rose transition-colors hover:bg-rose/10"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
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
