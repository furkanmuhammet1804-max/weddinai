"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Sparkles, Camera } from "lucide-react";
import QRCode from "qrcode";
import type { SlaytFoto } from "@/lib/oda/veri";

const GECIS_MS = 6000; // fotoğraf başına süre
const POLL_MS = 18000; // yeni fotoğraf kontrol aralığı

export function Slideshow({
  baslik,
  slug,
  ilk,
}: {
  baslik: string;
  slug: string;
  ilk: SlaytFoto[];
}) {
  const [fotograflar, setFotograflar] = useState<SlaytFoto[]>(ilk);
  const [aktif, setAktif] = useState(0);
  const [bildirim, setBildirim] = useState<SlaytFoto | null>(null);
  const [qr, setQr] = useState("");
  const bilinenRef = useRef<Set<string>>(new Set(ilk.map((f) => f.id)));
  const bildirimTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sonTazeleRef = useRef(0);

  // İmzalı URL süresi dolup görsel kırıldığında (halka açık ekranda) hemen
  // yeni imzalı URL'leri çek. Storm olmasın diye 4 sn'de bir.
  const tazele = useCallback(async () => {
    const simdi = Date.now();
    if (simdi - sonTazeleRef.current < 4000) return;
    sonTazeleRef.current = simdi;
    try {
      const res = await fetch(`/api/slayt/${slug}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const gelen: SlaytFoto[] = data.fotograflar ?? [];
      if (gelen.length > 0) setFotograflar(gelen);
    } catch {
      /* sessiz — bir sonraki turda dene */
    }
  }, [slug]);

  // Misafir yükleme QR'ı ("sen de paylaş")
  useEffect(() => {
    const url = `${window.location.origin}/e/${slug}`;
    QRCode.toDataURL(url, { width: 240, margin: 1 })
      .then(setQr)
      .catch(() => setQr(""));
  }, [slug]);

  // Otomatik geçiş
  useEffect(() => {
    if (fotograflar.length <= 1) return;
    const t = setInterval(
      () => setAktif((i) => (i + 1) % fotograflar.length),
      GECIS_MS,
    );
    return () => clearInterval(t);
  }, [fotograflar.length]);

  // Periyodik yeni fotoğraf çekme + imzalı URL tazeleme
  useEffect(() => {
    let iptal = false;
    async function cek() {
      try {
        const res = await fetch(`/api/slayt/${slug}`, { cache: "no-store" });
        if (!res.ok || iptal) return;
        const data = await res.json();
        const gelen: SlaytFoto[] = data.fotograflar ?? [];
        const yeniler = gelen.filter((f) => !bilinenRef.current.has(f.id));
        setFotograflar(gelen); // URL'leri her seferinde tazele (imza süresi)
        gelen.forEach((f) => bilinenRef.current.add(f.id));
        if (yeniler.length > 0) {
          const son = yeniler[yeniler.length - 1];
          const idx = gelen.findIndex((f) => f.id === son.id);
          if (idx >= 0) setAktif(idx);
          setBildirim(son);
          if (bildirimTimer.current) clearTimeout(bildirimTimer.current);
          bildirimTimer.current = setTimeout(() => setBildirim(null), 4500);
        }
      } catch {
        /* sessiz — bir sonraki turda dene */
      }
    }
    const t = setInterval(cek, POLL_MS);
    return () => {
      iptal = true;
      clearInterval(t);
      if (bildirimTimer.current) clearTimeout(bildirimTimer.current);
    };
  }, [slug]);

  // İndeks sınır güvenliği
  useEffect(() => {
    if (fotograflar.length === 0) return;
    // Liste küçülürse aktif indeksi sınıra çek; kasıtlı.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAktif((i) => (i >= fotograflar.length ? fotograflar.length - 1 : i));
  }, [fotograflar.length]);

  if (fotograflar.length === 0) {
    return <BosEkran baslik={baslik} qr={qr} />;
  }

  const idx =
    ((aktif % fotograflar.length) + fotograflar.length) % fotograflar.length;
  const mevcut = fotograflar[idx];

  return (
    <div className="relative h-[100dvh] w-screen overflow-hidden bg-black">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={mevcut.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1 }}
          className="absolute inset-0"
        >
          {/* Bulanık dolgu arka plan */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mevcut.url}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-2xl"
          />
          {/* Ana fotoğraf (Ken Burns) */}
          <motion.img
            src={mevcut.url}
            alt={mevcut.guest_name ?? "Anı"}
            onError={tazele}
            initial={{ scale: 1.04 }}
            animate={{ scale: 1.12 }}
            transition={{ duration: GECIS_MS / 1000 + 1.2, ease: "linear" }}
            className="absolute inset-0 h-full w-full object-contain"
          />
        </motion.div>
      </AnimatePresence>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/35" />

      {/* Üst bar */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between p-6 sm:p-10">
        <div className="flex items-center gap-2 text-white/90">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-2.5 w-2.5 animate-ping rounded-full bg-rose opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose" />
          </span>
          <span className="text-sm font-medium uppercase tracking-widest">
            Canlı
          </span>
        </div>
        <div className="text-right text-white/85">
          <span className="font-display text-3xl font-semibold drop-shadow-lg sm:text-4xl">
            {fotograflar.length}
          </span>
          <span className="ml-2 text-sm uppercase tracking-widest">anı</span>
        </div>
      </div>

      {/* Alt bilgi */}
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-7 text-white sm:p-12">
        <motion.div
          key={`bilgi-${mevcut.id}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <p className="font-display text-3xl font-semibold drop-shadow-lg sm:text-5xl">
            {baslik}
          </p>
          {mevcut.guest_name && (
            <div className="mt-2 flex items-center gap-2 text-white/85">
              <Camera className="h-4 w-4" />
              <span className="text-base sm:text-lg">
                {mevcut.guest_name} paylaştı
              </span>
            </div>
          )}
        </motion.div>

        {/* QR köşe — "sen de paylaş" */}
        {qr && (
          <div className="hidden shrink-0 items-center gap-3 rounded-2xl bg-white/90 p-3 shadow-2xl backdrop-blur sm:flex">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="Yükleme QR" className="h-20 w-20 rounded-lg" />
            <div className="pr-1 text-foreground">
              <p className="font-display text-sm font-semibold">Sen de paylaş</p>
              <p className="text-xs text-muted-foreground">
                Okut, anını yükle 💛
              </p>
            </div>
          </div>
        )}
      </div>

      {/* "Yeni anı geldi" bildirimi */}
      <AnimatePresence>
        {bildirim && (
          <motion.div
            initial={{ opacity: 0, scale: 0.6, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 180, damping: 16 }}
            className="absolute left-1/2 top-10 z-20 -translate-x-1/2"
          >
            <div className="flex items-center gap-4 rounded-3xl bg-white/95 px-7 py-5 shadow-2xl backdrop-blur">
              <motion.span
                animate={{ rotate: [0, -12, 12, 0] }}
                transition={{ duration: 0.6, repeat: 1 }}
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground"
              >
                <Sparkles className="h-6 w-6" />
              </motion.span>
              <div>
                <p className="font-display text-lg font-semibold text-foreground">
                  Yeni anı geldi! 🎉
                </p>
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Heart className="h-3.5 w-3.5 fill-rose text-rose" />
                  {bildirim.guest_name ?? "Bir misafir"} az önce paylaştı
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BosEkran({ baslik, qr }: { baslik: string; qr: string }) {
  return (
    <div className="relative flex h-[100dvh] w-screen flex-col items-center justify-center overflow-hidden bg-[#1a1613] text-center text-white">
      <div className="absolute inset-x-0 top-0 flex items-center gap-2 p-6 text-white/90 sm:p-10">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-2.5 w-2.5 animate-ping rounded-full bg-rose opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose" />
        </span>
        <span className="text-sm font-medium uppercase tracking-widest">
          Canlı
        </span>
      </div>

      <motion.span
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10"
      >
        <Camera className="h-9 w-9 text-white/80" />
      </motion.span>
      <p className="mt-6 font-display text-2xl font-semibold drop-shadow-lg sm:text-4xl">
        {baslik}
      </p>
      <p className="mt-3 max-w-md px-6 text-base text-white/70 sm:text-lg">
        İlk anılar bekleniyor… Misafirler fotoğraf paylaştıkça burada canlı
        olarak görünecek.
      </p>

      {qr && (
        <div className="mt-8 flex items-center gap-3 rounded-2xl bg-white/90 p-3 text-foreground shadow-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="Yükleme QR" className="h-24 w-24 rounded-lg" />
          <div className="pr-2 text-left">
            <p className="font-display text-sm font-semibold">İlk paylaşan ol</p>
            <p className="text-xs text-muted-foreground">QR&apos;ı okut, yükle</p>
          </div>
        </div>
      )}
    </div>
  );
}
