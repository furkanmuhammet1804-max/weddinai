"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadCloud,
  Image as ImageIcon,
  Video,
  Mic,
  PenLine,
  CheckCircle2,
  Square,
  Sparkles,
  AlertTriangle,
  Lock,
  RotateCw,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { turEtiket } from "@/lib/etkinlik";
import { AiOneriModal } from "@/components/ai/ai-oneri-modal";

// Özellik 1 — Tebrik mesajı asistanı ton seçenekleri.
const TEBRIK_TONLAR = [
  { deger: "Kısa", etiket: "Kısa" },
  { deger: "Samimi", etiket: "Samimi" },
  { deger: "Duygusal", etiket: "Duygusal" },
  { deger: "Resmi", etiket: "Resmi" },
  { deger: "Komik", etiket: "Komik" },
];

const MEDYA_BUCKET = "event-media";
const SES_BUCKET = "event-audio";
const MAKS_DOSYA_BAYT = 50 * 1024 * 1024; // 50 MiB
// Tek seferde seçilebilen dosya adedi. Yükleme sıralı (eşzamanlılık 1, bkz.
// dosyaSec) olduğundan 50 dosya storage/ağı zorlamaz; batching gerekmez.
const MAKS_DOSYA_ADET = 50;

type Sekme = "yukle" | "ani";
type DosyaDurum = "bekliyor" | "yukleniyor" | "tamam" | "hata";

interface YuklemeDosya {
  id: string;
  dosya: File;
  ad: string;
  tur: "fotograf" | "video";
  boyut: number;
  ilerleme: number;
  durum: DosyaDurum;
  hata?: string;
  onizleme?: string;
}

// Gerçek ilerleme için XHR ile doğrudan Storage REST'e yükler (foto + video).
function xhrYukle(
  bucket: string,
  path: string,
  file: File,
  onIlerleme: (p: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/${bucket}/${path
      .split("/")
      .map(encodeURIComponent)
      .join("/")}`;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Authorization", `Bearer ${key}`);
    xhr.setRequestHeader("apikey", key);
    xhr.setRequestHeader("x-upsert", "false");
    if (file.type) xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onIlerleme(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error("upload"));
    xhr.onerror = () => reject(new Error("network"));
    xhr.send(file);
  });
}

function bytKbMb(bayt: number): string {
  if (bayt >= 1024 * 1024) return `${(bayt / (1024 * 1024)).toFixed(1)} MB`;
  if (bayt >= 1024) return `${Math.round(bayt / 1024)} KB`;
  return `${bayt} B`;
}

function dosyaTuru(f: File): "fotograf" | "video" | null {
  const t = (f.type || "").toLowerCase();
  if (t.startsWith("image/")) {
    if (t.includes("heic") || t.includes("heif")) return null;
    return "fotograf";
  }
  if (t.startsWith("video/")) return "video";
  if (!t) {
    const ad = f.name.toLowerCase();
    if (/\.(jpe?g|png|gif|webp|avif)$/.test(ad)) return "fotograf";
    if (/\.(mp4|mov|webm|m4v)$/.test(ad)) return "video";
  }
  return null;
}

function uzanti(f: File): string {
  const ad = f.name.toLowerCase();
  const nokta = ad.lastIndexOf(".");
  if (nokta > 0 && nokta < ad.length - 1) return ad.slice(nokta + 1);
  return f.type.startsWith("video/") ? "mp4" : "jpg";
}

// Ses kaydı için tarayıcının desteklediği EN UYUMLU formatı seçer.
// iOS Safari yalnızca mp4/aac kaydedip çalabilir (webm desteklemez); bu yüzden
// önce mp4/aac denenir → kayıt mümkün olduğunca her cihazda açılabilir olur.
// Sabit ".webm" yerine gerçek uzantı kullanılır ki depolama doğru içerik
// tipiyle sunsun ve müşteri panelinde ses çalınabilsin.
function sesKaydiTipi(): { mimeType?: string; uzanti: string } {
  if (typeof MediaRecorder === "undefined") return { uzanti: "webm" };
  const adaylar: { m: string; e: string }[] = [
    { m: "audio/mp4", e: "m4a" },
    { m: "audio/aac", e: "aac" },
    { m: "audio/webm;codecs=opus", e: "webm" },
    { m: "audio/webm", e: "webm" },
    { m: "audio/ogg;codecs=opus", e: "ogg" },
  ];
  for (const a of adaylar) {
    try {
      if (MediaRecorder.isTypeSupported(a.m)) return { mimeType: a.m, uzanti: a.e };
    } catch {
      /* yoksay */
    }
  }
  return { uzanti: "webm" };
}

export function GuestApp({
  eventId,
  slug,
  baslik,
  tur,
  kapali = false,
}: {
  eventId: string;
  slug: string;
  baslik: string;
  tur: string;
  kapali?: boolean;
}) {
  const [sekme, setSekme] = useState<Sekme>("yukle");

  const sekmeler: { id: Sekme; etiket: string; icon: typeof UploadCloud }[] = [
    { id: "yukle", etiket: "Anı Yükle", icon: UploadCloud },
    { id: "ani", etiket: "Anı Bırak", icon: PenLine },
  ];

  return (
    <div className="bg-aura flex min-h-screen flex-col">
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-rose-soft via-primary-soft to-background opacity-70" />
        <div className="relative mx-auto max-w-2xl px-5 pb-10 pt-16 text-center">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card/70 px-4 py-1.5 text-xs font-medium text-primary-deep"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {turEtiket(tur)}
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display mt-5 text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            {baslik}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-2 text-muted-foreground"
          >
            Odasına hoş geldiniz 💛 Bu özel anın bir parçası olun.
          </motion.p>
        </div>
      </header>

      <div className="sticky top-0 z-30 border-y border-border/60 bg-card/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center gap-1 px-3">
          {sekmeler.map((s) => {
            const Icon = s.icon;
            const aktif = sekme === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setSekme(s.id)}
                className="relative flex flex-1 items-center justify-center gap-2 py-3.5 text-sm font-medium transition-colors"
              >
                <Icon
                  className={`h-4 w-4 ${aktif ? "text-primary" : "text-muted-foreground"}`}
                />
                <span
                  className={aktif ? "text-foreground" : "text-muted-foreground"}
                >
                  {s.etiket}
                </span>
                {aktif && (
                  <motion.div
                    layoutId="misafir-sekme"
                    className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-primary"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-8">
        <AnimatePresence mode="wait">
          {sekme === "yukle" ? (
            <motion.div
              key="yukle"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <YuklemeAlani eventId={eventId} slug={slug} kapali={kapali} />
            </motion.div>
          ) : (
            <motion.div
              key="ani"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <AniBirak
                eventId={eventId}
                slug={slug}
                baslik={baslik}
                kapali={kapali}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" />
          Yüklediğiniz içerikler yalnızca etkinlik sahibine gösterilir.
        </p>
      </main>

      <footer className="py-8 text-center text-xs text-muted-foreground">
        <span className="font-display">WeddinAI</span> ile güçlendirilmiştir
      </footer>
    </div>
  );
}

/* ----------------------- Yükleme Alanı (gerçek) ----------------------- */
function YuklemeAlani({
  eventId,
  slug,
  kapali,
}: {
  eventId: string;
  slug: string;
  kapali: boolean;
}) {
  const [isim, setIsim] = useState("");
  const [dosyalar, setDosyalar] = useState<YuklemeDosya[]>([]);
  const [adim, setAdim] = useState<"bos" | "yukleniyor" | "tamam">("bos");
  const [reddedilenler, setReddedilenler] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const yukleniyorRef = useRef(false);

  // İsmi en güncel haliyle yükleme sırasında kullanabilmek için ref.
  const isimRef = useRef("");
  useEffect(() => {
    isimRef.current = isim;
  }, [isim]);

  useEffect(() => {
    return () => {
      setDosyalar((onceki) => {
        onceki.forEach((d) => d.onizleme && URL.revokeObjectURL(d.onizleme));
        return onceki;
      });
    };
  }, []);

  const durumGuncelle = useCallback(
    (id: string, yeni: Partial<YuklemeDosya>) => {
      setDosyalar((o) => o.map((x) => (x.id === id ? { ...x, ...yeni } : x)));
    },
    [],
  );

  const tekDosyaYukle = useCallback(
    async (d: YuklemeDosya) => {
      durumGuncelle(d.id, { durum: "yukleniyor", ilerleme: 0, hata: undefined });
      try {
        const path = `${eventId}/${crypto.randomUUID()}.${uzanti(d.dosya)}`;
        await xhrYukle(MEDYA_BUCKET, path, d.dosya, (p) =>
          durumGuncelle(d.id, { ilerleme: p }),
        );

        const supabase = createClient();
        const { data: yeniId, error: rpcErr } = await supabase.rpc(
          "misafir_medya_ekle",
          {
            p_slug: slug,
            p_storage_path: path,
            p_file_type: d.tur,
            p_file_size: d.dosya.size,
            p_guest_name: isimRef.current.trim() || null,
          },
        );
        if (rpcErr) throw rpcErr;

        durumGuncelle(d.id, { durum: "tamam", ilerleme: 100 });

        // Yüklenir yüklenmez arka planda otomatik kategorile (ateşle-unut;
        // UI'ı bloklamaz, hata olsa da yükleme başarılı sayılır).
        if (typeof yeniId === "string") {
          void fetch("/api/medya/otokategori", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug, mediaId: yeniId }),
            keepalive: true,
          }).catch(() => {});
          // Galeri için thumb/medium türevleri (sharp) — ateşle-unut.
          void fetch("/api/medya/kucuk-uret", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug, mediaId: yeniId }),
            keepalive: true,
          }).catch(() => {});
        }
      } catch {
        durumGuncelle(d.id, {
          durum: "hata",
          hata: "Yükleme başarısız.",
        });
      }
    },
    [durumGuncelle, eventId, slug],
  );

  function dosyaSec(secilen: FileList | null) {
    if (yukleniyorRef.current) return;
    if (!secilen || secilen.length === 0) return;

    const kabul: YuklemeDosya[] = [];
    const red: string[] = [];
    const gorulen = new Set<string>();

    for (const f of Array.from(secilen)) {
      if (kabul.length >= MAKS_DOSYA_ADET) {
        red.push(`En fazla ${MAKS_DOSYA_ADET} dosya; fazlası atlandı.`);
        break;
      }
      const anahtar = `${f.name}__${f.size}`;
      if (gorulen.has(anahtar)) continue;
      gorulen.add(anahtar);

      const tur = dosyaTuru(f);
      if (!tur) {
        red.push(`${f.name}: desteklenmeyen tür (HEIC/diğer).`);
        continue;
      }
      if (f.size === 0) {
        red.push(`${f.name}: boş dosya.`);
        continue;
      }
      if (f.size > MAKS_DOSYA_BAYT) {
        red.push(`${f.name}: çok büyük (${bytKbMb(f.size)} · sınır 50 MB).`);
        continue;
      }

      let onizleme: string | undefined;
      if (tur === "fotograf") {
        try {
          onizleme = URL.createObjectURL(f);
        } catch {
          onizleme = undefined;
        }
      }

      kabul.push({
        id: `${Date.now()}_${kabul.length}_${Math.random().toString(36).slice(2, 8)}`,
        dosya: f,
        ad: f.name,
        tur,
        boyut: f.size,
        ilerleme: 0,
        durum: "bekliyor",
        onizleme,
      });
    }

    setReddedilenler(red);
    if (kabul.length === 0) return;

    setDosyalar(kabul);
    setAdim("yukleniyor");
    yukleniyorRef.current = true;
    // Sırayla yükle (paralel storage limitlerini zorlamamak için).
    (async () => {
      for (const d of kabul) {
        await tekDosyaYukle(d);
      }
    })();
  }

  useEffect(() => {
    if (adim !== "yukleniyor" || dosyalar.length === 0) return;
    const devam = dosyalar.some(
      (d) => d.durum === "yukleniyor" || d.durum === "bekliyor",
    );
    if (!devam) {
      yukleniyorRef.current = false;
      const hepsiHata = dosyalar.every((d) => d.durum === "hata");
      // Yükleme ilerlemesine göre adım geçişi; effect içi kasıtlı.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (!hepsiHata) setAdim("tamam");
    }
  }, [dosyalar, adim]);

  const basarili = dosyalar.filter((d) => d.durum === "tamam").length;
  const hatali = dosyalar.filter((d) => d.durum === "hata").length;

  async function yeniden(d: YuklemeDosya) {
    setAdim("yukleniyor");
    yukleniyorRef.current = true;
    await tekDosyaYukle(d);
  }

  function sifirla() {
    dosyalar.forEach((d) => d.onizleme && URL.revokeObjectURL(d.onizleme));
    yukleniyorRef.current = false;
    setDosyalar([]);
    setReddedilenler([]);
    setAdim("bos");
    if (inputRef.current) inputRef.current.value = "";
  }

  if (kapali) {
    return (
      <div className="rounded-3xl border border-border bg-card p-10 text-center shadow-elegant">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Lock className="h-8 w-8" />
        </div>
        <h3 className="font-display mt-5 text-xl font-semibold">
          Yükleme kapandı
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          Bu etkinlik arşivlendi; yeni anı yüklenemiyor.
        </p>
      </div>
    );
  }

  if (adim === "tamam") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-3xl border border-border bg-card p-10 text-center shadow-elegant"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 14 }}
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-primary"
        >
          <CheckCircle2 className="h-9 w-9" />
        </motion.div>
        <h3 className="font-display mt-5 text-xl font-semibold">Teşekkürler! 💛</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {basarili} anınız başarıyla yüklendi.
        </p>
        {hatali > 0 && (
          <p className="mt-2 text-sm text-rose">{hatali} dosya yüklenemedi.</p>
        )}
        <Button className="mt-6" variant="soft" onClick={sifirla}>
          Yeni Anı Yükle
        </Button>
      </motion.div>
    );
  }

  const suruyor = adim === "yukleniyor";

  return (
    <div>
      <div className="mb-4">
        <label className="text-sm font-medium">Adınız (isteğe bağlı)</label>
        <input
          value={isim}
          onChange={(e) => setIsim(e.target.value)}
          placeholder="Örn. Ayşe Kaya"
          disabled={suruyor}
          className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary disabled:opacity-60"
        />
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        aria-label="Fotoğraf ve video seç"
        className="hidden"
        disabled={suruyor}
        onChange={(e) => dosyaSec(e.target.files)}
      />
      <button
        type="button"
        onClick={() => !suruyor && inputRef.current?.click()}
        disabled={suruyor}
        className="glass group flex w-full flex-col items-center rounded-3xl border-2 border-dashed border-primary/30 px-6 py-14 text-center transition-colors hover:border-primary/60 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <motion.span
          animate={suruyor ? { y: 0 } : { y: [0, -8, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-elegant"
        >
          {suruyor ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : (
            <UploadCloud className="h-8 w-8" />
          )}
        </motion.span>
        <p className="font-display mt-5 text-lg font-semibold">
          {suruyor ? "Yükleniyor…" : "Fotoğraf & video yüklemek için dokunun"}
        </p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          En fazla {MAKS_DOSYA_ADET} dosya · dosya başına 50 MB
        </p>
        <div className="mt-5 flex gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5">
            <ImageIcon className="h-3.5 w-3.5" /> Fotoğraf
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5">
            <Video className="h-3.5 w-3.5" /> Video
          </span>
        </div>
      </button>

      <AnimatePresence>
        {reddedilenler.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role="alert"
            className="mt-4 rounded-2xl border border-rose/40 bg-rose/5 p-4 text-sm text-rose"
          >
            <p className="flex items-center gap-2 font-medium">
              <AlertTriangle className="h-4 w-4" /> Bazı dosyalar atlandı
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
              {reddedilenler.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {dosyalar.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-5 space-y-3"
          >
            {dosyalar.map((d) => (
              <div
                key={d.id}
                className="glass rounded-2xl border border-border/60 p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary-soft text-primary-deep">
                    {d.onizleme ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={d.onizleme}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : d.tur === "video" ? (
                      <Video className="h-5 w-5" />
                    ) : (
                      <ImageIcon className="h-5 w-5" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{d.ad}</p>
                    {d.durum === "yukleniyor" || d.durum === "bekliyor" ? (
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-accent to-primary transition-all duration-300"
                          style={{ width: `${d.ilerleme}%` }}
                        />
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {bytKbMb(d.boyut)}
                      </p>
                    )}
                  </div>
                  <span className="flex w-8 shrink-0 items-center justify-end">
                    {d.durum === "tamam" ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : d.durum === "hata" ? (
                      <button
                        type="button"
                        onClick={() => yeniden(d)}
                        aria-label="Tekrar yükle"
                        className="rounded-full p-1 text-rose hover:bg-rose/10"
                      >
                        <RotateCw className="h-4 w-4" />
                      </button>
                    ) : (
                      <span className="text-xs font-medium text-muted-foreground">
                        {d.ilerleme}%
                      </span>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ----------------------- Anı Bırak (yazı + ses, gerçek) ----------------------- */
function AniBirak({
  eventId,
  slug,
  baslik,
  kapali,
}: {
  eventId: string;
  slug: string;
  baslik: string;
  kapali: boolean;
}) {
  const [isim, setIsim] = useState("");
  const [mesaj, setMesaj] = useState("");
  const [gonderildi, setGonderildi] = useState(false);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [aiAcik, setAiAcik] = useState(false);

  // Ses kaydı
  const [kayitta, setKayitta] = useState(false);
  const [sesBlob, setSesBlob] = useState<Blob | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const parcalarRef = useRef<Blob[]>([]);
  const sesTipiRef = useRef<{ mimeType?: string; uzanti: string }>({
    uzanti: "webm",
  });

  useEffect(() => {
    return () => {
      // Unmount'ta kaydı durdur.
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
        recorderRef.current.stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  async function kaydiBaslat() {
    setHata(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const tip = sesKaydiTipi();
      sesTipiRef.current = tip;
      const rec = tip.mimeType
        ? new MediaRecorder(stream, { mimeType: tip.mimeType })
        : new MediaRecorder(stream);
      parcalarRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) parcalarRef.current.push(e.data);
      };
      rec.onstop = () => {
        const blob = new Blob(parcalarRef.current, {
          type: rec.mimeType || tip.mimeType || "audio/webm",
        });
        setSesBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      rec.start();
      recorderRef.current = rec;
      setKayitta(true);
    } catch {
      setHata("Mikrofona erişilemedi. İzin verdiğinizden emin olun.");
    }
  }

  function kaydiDurdur() {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    setKayitta(false);
  }

  async function gonder() {
    if (gonderiliyor) return;
    setHata(null);
    const ad = isim.trim();
    const metin = mesaj.trim();
    if (!metin && !sesBlob) {
      setHata("Lütfen bir mesaj yazın veya sesli anı bırakın.");
      return;
    }
    setGonderiliyor(true);
    try {
      const supabase = createClient();
      let sesPath: string | null = null;

      if (sesBlob) {
        const uz = sesTipiRef.current.uzanti || "webm";
        sesPath = `${eventId}/${crypto.randomUUID()}.${uz}`;
        const { error: upErr } = await supabase.storage
          .from(SES_BUCKET)
          .upload(sesPath, sesBlob, {
            contentType: sesBlob.type || "audio/webm",
            upsert: false,
          });
        if (upErr) throw upErr;
      }

      const { error: rpcErr } = await supabase.rpc("misafir_ani_ekle", {
        p_slug: slug,
        p_guest_name: ad || null,
        p_message_text: metin || null,
        p_audio_path: sesPath,
      });
      if (rpcErr) throw rpcErr;

      setGonderildi(true);
    } catch {
      setHata("Anı gönderilemedi. Lütfen tekrar deneyin.");
    } finally {
      setGonderiliyor(false);
    }
  }

  if (kapali) {
    return (
      <div className="rounded-3xl border border-border bg-card p-10 text-center shadow-elegant">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Lock className="h-8 w-8" />
        </div>
        <h3 className="font-display mt-5 text-xl font-semibold">Anı defteri kapalı</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          Bu etkinlik arşivlendi; yeni anı bırakılamıyor.
        </p>
      </div>
    );
  }

  if (gonderildi) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-3xl border border-border bg-card p-10 text-center shadow-elegant"
      >
        <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
        <h3 className="font-display mt-4 text-xl font-semibold">
          Anınız eklendi 💛
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Paylaştığınız için teşekkürler!
        </p>
        <Button
          className="mt-6"
          variant="soft"
          onClick={() => {
            setGonderildi(false);
            setMesaj("");
            setSesBlob(null);
          }}
        >
          Yeni Anı Bırak
        </Button>
      </motion.div>
    );
  }

  return (
    <>
    <div className="rounded-3xl border border-border bg-card p-6 shadow-elegant">
      <h3 className="font-display text-lg font-semibold">Bir not bırakın</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        İçten dileklerinizi yazın veya sesli bir mesaj bırakın.
      </p>

      <input
        value={isim}
        onChange={(e) => setIsim(e.target.value)}
        placeholder="Adınız (isteğe bağlı)"
        className="mt-5 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
      />
      <textarea
        value={mesaj}
        onChange={(e) => setMesaj(e.target.value)}
        placeholder="Dileğinizi buraya yazın..."
        rows={4}
        className="mt-3 w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
      />

      <button
        type="button"
        onClick={() => setAiAcik(true)}
        className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-primary/40 px-3.5 py-1.5 text-xs font-medium text-primary-deep transition-colors hover:bg-primary-soft/50"
      >
        <Sparkles className="h-3.5 w-3.5" /> AI ile yardım al
      </button>

      {sesBlob && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-muted px-3 py-2">
          <Mic className="h-4 w-4 shrink-0 text-primary" />
          <audio
            src={URL.createObjectURL(sesBlob)}
            controls
            className="h-8 w-full"
          />
          <button
            type="button"
            onClick={() => setSesBlob(null)}
            className="shrink-0 text-xs text-rose hover:underline"
          >
            Sil
          </button>
        </div>
      )}

      {hata && (
        <p className="mt-3 rounded-xl bg-rose-soft px-4 py-2.5 text-xs font-medium text-rose">
          {hata}
        </p>
      )}

      <div className="mt-4 flex items-center gap-3">
        <Button
          className="flex-1"
          onClick={gonder}
          disabled={gonderiliyor || (!mesaj.trim() && !sesBlob)}
        >
          {gonderiliyor ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <PenLine className="h-4 w-4" />
          )}
          Gönder
        </Button>
        {!sesBlob && (
          <button
            type="button"
            onClick={kayitta ? kaydiDurdur : kaydiBaslat}
            className={`flex h-11 items-center gap-2 rounded-full px-5 text-sm font-medium transition-colors ${
              kayitta
                ? "bg-rose text-white"
                : "border border-primary/40 text-foreground hover:bg-primary-soft/50"
            }`}
          >
            {kayitta ? (
              <>
                <Square className="h-3.5 w-3.5 fill-current" /> Durdur
              </>
            ) : (
              <>
                <Mic className="h-4 w-4" /> Sesli
              </>
            )}
          </button>
        )}
      </div>

      {kayitta && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 flex items-center justify-center gap-1.5"
        >
          {Array.from({ length: 24 }).map((_, i) => (
            <motion.span
              key={i}
              className="w-1 rounded-full bg-rose"
              animate={{ height: [6, 8 + Math.abs(Math.sin(i * 1.7)) * 24, 6] }}
              transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.05 }}
            />
          ))}
        </motion.div>
      )}
    </div>

    {aiAcik && (
      <AiOneriModal
        baslik="AI ile Tebrik Mesajı"
        altBaslik={`${baslik} için dilek önerileri`}
        endpoint="/api/ai/tebrik-oneri"
        secenekEtiket="Ton"
        secenekler={TEBRIK_TONLAR}
        govde={(ton) => ({ ton, cift_ad: baslik || null })}
        aktarEtiket="Mesaja aktar"
        onAktar={(metin) => {
          setMesaj(metin);
          setAiAcik(false);
        }}
        onClose={() => setAiAcik(false)}
      />
    )}
    </>
  );
}
