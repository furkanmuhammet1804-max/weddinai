"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckSquare,
  CheckCircle2,
} from "lucide-react";
import JSZip from "jszip";

interface Foto {
  id: string;
  url: string;
}

const GOSTER_ADIM = 48;

function dosyaAdi(f: Foto, i: number): string {
  let ext = "jpg";
  try {
    const p = new URL(f.url).pathname;
    const nokta = p.lastIndexOf(".");
    if (nokta >= 0) {
      const e = p.slice(nokta + 1).toLowerCase();
      if (/^[a-z0-9]{2,5}$/.test(e)) ext = e;
    }
  } catch {
    /* yoksay */
  }
  return `${String(i + 1).padStart(3, "0")}.${ext}`;
}

export function ShowroomGaleri({ fotograflar }: { fotograflar: Foto[] }) {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [secimModu, setSecimModu] = useState(false);
  const [secili, setSecili] = useState<Set<string>>(new Set());
  const [indirme, setIndirme] = useState<{
    yapilan: number;
    toplam: number;
  } | null>(null);
  const [gosterilen, setGosterilen] = useState(GOSTER_ADIM);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (g) => {
        if (g[0]?.isIntersecting) {
          setGosterilen((x) => Math.min(x + GOSTER_ADIM, fotograflar.length));
        }
      },
      { rootMargin: "600px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [fotograflar.length]);

  async function tekBlobIndir(f: Foto, i: number) {
    const res = await fetch(f.url);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = dosyaAdi(f, i);
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function tekIndir(f: Foto, i: number) {
    setIndirme({ yapilan: 0, toplam: 1 });
    try {
      await tekBlobIndir(f, i);
    } catch {
      /* sessiz */
    }
    setIndirme(null);
  }

  async function topluIndir(liste: Foto[]) {
    const indirilecek = liste.filter((f) => f.url);
    if (indirilecek.length === 0) return;
    if (indirilecek.length === 1) {
      await tekIndir(indirilecek[0], 0);
      return;
    }
    setIndirme({ yapilan: 0, toplam: indirilecek.length });
    try {
      const zip = new JSZip();
      for (let i = 0; i < indirilecek.length; i++) {
        try {
          const res = await fetch(indirilecek[i].url);
          zip.file(dosyaAdi(indirilecek[i], i), await res.blob());
        } catch {
          /* atla */
        }
        setIndirme({ yapilan: i + 1, toplam: indirilecek.length });
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "showroom-fotograflar.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      /* sessiz */
    }
    setIndirme(null);
  }

  function secimToggle(id: string) {
    setSecili((o) => {
      const y = new Set(o);
      if (y.has(id)) y.delete(id);
      else y.add(id);
      return y;
    });
  }

  const seciliFotolar = fotograflar.filter((f) => secili.has(f.id));

  return (
    <>
      {/* Araç çubuğu */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {fotograflar.length} fotoğraf
        </p>
        <div className="flex items-center gap-2">
          {!secimModu ? (
            <>
              <button
                type="button"
                onClick={() => topluIndir(fotograflar)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium hover:border-primary hover:text-primary"
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
                onClick={() =>
                  secili.size === fotograflar.length
                    ? setSecili(new Set())
                    : setSecili(new Set(fotograflar.map((f) => f.id)))
                }
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium hover:border-primary hover:text-primary"
              >
                {secili.size === fotograflar.length
                  ? "Seçimi kaldır"
                  : "Tümünü seç"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSecimModu(false);
                  setSecili(new Set());
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium hover:border-primary hover:text-primary"
              >
                <X className="h-4 w-4" /> Vazgeç
              </button>
            </>
          )}
        </div>
      </div>

      <div className="columns-2 gap-4 [column-fill:_balance] sm:columns-3 lg:columns-4">
        {fotograflar.slice(0, gosterilen).map((f, i) => {
          const sec = secili.has(f.id);
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => (secimModu ? secimToggle(f.id) : setLightbox(i))}
              className="group relative mb-4 block w-full break-inside-avoid"
            >
              <div
                className={`overflow-hidden rounded-2xl border bg-card shadow-sm transition-all ${
                  sec ? "border-primary ring-2 ring-primary" : "border-border"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={f.url}
                  alt="Anı"
                  loading="lazy"
                  className="w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>

              {secimModu && (
                <span
                  className={`absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                    sec
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-white bg-black/30 text-transparent"
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                </span>
              )}

              {!secimModu && (
                <span
                  role="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.stopPropagation();
                    tekIndir(f, i);
                  }}
                  className="absolute right-2 top-2 hidden rounded-full bg-black/40 p-1.5 text-white backdrop-blur transition-colors hover:bg-black/60 group-hover:block"
                  aria-label="İndir"
                >
                  <Download className="h-4 w-4" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {gosterilen < fotograflar.length && (
        <div ref={sentinelRef} className="flex justify-center py-6">
          <button
            type="button"
            onClick={() =>
              setGosterilen((x) => Math.min(x + GOSTER_ADIM, fotograflar.length))
            }
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium hover:border-primary hover:text-primary"
          >
            Daha fazla göster ({fotograflar.length - gosterilen})
          </button>
        </div>
      )}

      {/* Seçim alt çubuğu */}
      <AnimatePresence>
        {secimModu && (
          <motion.div
            initial={{ y: 80 }}
            animate={{ y: 0 }}
            exit={{ y: 80 }}
            className="sticky bottom-0 z-30 mt-4 border-t border-border bg-card/90 backdrop-blur-md"
          >
            <div
              className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-1 pt-3"
              style={{
                paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))",
              }}
            >
              <p className="text-sm font-medium">{secili.size} seçili</p>
              <button
                type="button"
                disabled={secili.size === 0}
                onClick={() => topluIndir(seciliFotolar)}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-elegant hover:brightness-110 disabled:opacity-50"
              >
                <Download className="h-4 w-4" /> Seçilenleri indir
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox !== null && fotograflar[lightbox] && (
          <Lightbox
            fotograflar={fotograflar}
            index={lightbox}
            indiriyor={!!indirme}
            onKapat={() => setLightbox(null)}
            onGit={(i) => setLightbox(i)}
            onIndir={(f, i) => tekIndir(f, i)}
          />
        )}
      </AnimatePresence>

      {/* İndirme ilerleme */}
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
    </>
  );
}

function Lightbox({
  fotograflar,
  index,
  indiriyor,
  onKapat,
  onGit,
  onIndir,
}: {
  fotograflar: Foto[];
  index: number;
  indiriyor: boolean;
  onKapat: () => void;
  onGit: (i: number) => void;
  onIndir: (f: Foto, i: number) => void;
}) {
  const f = fotograflar[index];
  const onceki = () =>
    onGit((index - 1 + fotograflar.length) % fotograflar.length);
  const sonraki = () => onGit((index + 1) % fotograflar.length);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") onKapat();
      else if (e.key === "ArrowLeft") onceki();
      else if (e.key === "ArrowRight") sonraki();
    };
    window.addEventListener("keydown", fn);
    const eski = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", fn);
      document.body.style.overflow = eski;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, fotograflar.length]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-sm"
      onClick={onKapat}
    >
      <div
        className="flex items-center justify-between gap-3 px-4 pb-3 text-white"
        style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-sm text-white/70">
          {index + 1} / {fotograflar.length}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onIndir(f, index)}
            disabled={indiriyor}
            className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium hover:bg-white/25 disabled:opacity-60"
          >
            {indiriyor ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            İndir
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

      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden px-2 pb-6"
        onClick={(e) => e.stopPropagation()}
      >
        {fotograflar.length > 1 && (
          <button
            type="button"
            onClick={onceki}
            aria-label="Önceki"
            className="absolute left-2 z-10 rounded-full bg-white/15 p-2 text-white hover:bg-white/25 sm:left-4"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        <motion.img
          key={index}
          src={f.url}
          alt="Anı"
          drag={fotograflar.length > 1 ? "x" : false}
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

        {fotograflar.length > 1 && (
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
