"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Sparkles, Camera, X } from "lucide-react";
import Link from "next/link";
import { medyaListesi } from "@/lib/mock-data";

const onayli = medyaListesi.filter((m) => m.status === "onaylandi");

const yeniIsimler = [
  "Selin Yıldız",
  "Burak Aydın",
  "Deniz Şahin",
  "Ece Arslan",
  "Naz Çelik",
];
const yeniTonlar = [
  "from-rose to-primary-soft",
  "from-accent to-primary",
  "from-primary-soft to-accent",
  "from-rose-soft to-rose",
];

interface Slayt {
  id: string;
  guest_name: string;
  tone: string;
  yeni?: boolean;
}

export function Slideshow({ baslik }: { baslik: string }) {
  const [slaytlar, setSlaytlar] = useState<Slayt[]>(
    onayli.map((m) => ({ id: m.id, guest_name: m.guest_name, tone: m.tone })),
  );
  const [aktif, setAktif] = useState(0);
  const [bildirim, setBildirim] = useState<Slayt | null>(null);

  // Otomatik geçiş
  useEffect(() => {
    const t = setInterval(() => {
      setAktif((i) => (i + 1) % slaytlar.length);
    }, 5000);
    return () => clearInterval(t);
  }, [slaytlar.length]);

  // Realtime simülasyonu: yeni fotoğraf "gelmesi"
  const yeniAniEkle = useCallback(() => {
    const yeni: Slayt = {
      id: `canli_${Date.now()}`,
      guest_name: yeniIsimler[Math.floor(Math.random() * yeniIsimler.length)],
      tone: yeniTonlar[Math.floor(Math.random() * yeniTonlar.length)],
      yeni: true,
    };
    setBildirim(yeni);
    setTimeout(() => {
      setSlaytlar((prev) => {
        const sonraki = [...prev, yeni];
        setAktif(sonraki.length - 1); // yeni gelen anı öne çıkar
        return sonraki;
      });
      setTimeout(() => setBildirim(null), 1500);
    }, 1800);
  }, []);

  useEffect(() => {
    const t = setInterval(yeniAniEkle, 9000);
    return () => clearInterval(t);
  }, [yeniAniEkle]);

  const mevcut = slaytlar[aktif];

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#1a1613]">
      {/* Arka plan slayt */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={mevcut.id}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1.14 }}
          exit={{ opacity: 0, scale: 1.18 }}
          transition={{
            opacity: { duration: 1.2 },
            scale: { duration: 6, ease: "linear" },
          }}
          className={`absolute inset-0 bg-gradient-to-br ${mevcut.tone}`}
        />
      </AnimatePresence>

      {/* Karartma katmanı */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/30" />

      {/* Üst bar */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between p-6 sm:p-10">
        <div className="flex items-center gap-2 text-white/90">
          <span className="flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-2.5 w-2.5 animate-ping rounded-full bg-rose opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose" />
          </span>
          <span className="text-sm font-medium uppercase tracking-widest">
            Canlı
          </span>
        </div>
        <Link
          href="/panel/slayt"
          className="rounded-full bg-white/15 p-2.5 text-white backdrop-blur transition-colors hover:bg-white/25"
          aria-label="Çıkış"
        >
          <X className="h-5 w-5" />
        </Link>
      </div>

      {/* Alt bilgi */}
      <div className="absolute inset-x-0 bottom-0 p-8 text-white sm:p-14">
        <motion.div
          key={`bilgi-${mevcut.id}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <p className="font-display text-3xl font-semibold drop-shadow-lg sm:text-5xl">
            {baslik}
          </p>
          <div className="mt-3 flex items-center gap-2 text-white/85">
            <Camera className="h-4 w-4" />
            <span className="text-base sm:text-lg">
              {mevcut.guest_name} paylaştı
            </span>
          </div>
        </motion.div>

        {/* İlerleme noktaları */}
        <div className="mt-6 flex gap-1.5">
          {slaytlar.slice(-12).map((s, i, arr) => {
            const gercekIndex = slaytlar.length - arr.length + i;
            return (
              <span
                key={s.id}
                className={`h-1 rounded-full transition-all duration-500 ${
                  gercekIndex === aktif ? "w-8 bg-white" : "w-3 bg-white/40"
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* "Yeni anı geldi" bildirimi */}
      <AnimatePresence>
        {bildirim && (
          <motion.div
            initial={{ opacity: 0, scale: 0.6, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 180, damping: 16 }}
            className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2"
          >
            <div className="flex items-center gap-4 rounded-3xl bg-white/95 px-8 py-6 shadow-2xl backdrop-blur">
              <motion.span
                animate={{ rotate: [0, -12, 12, 0] }}
                transition={{ duration: 0.6, repeat: 1 }}
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground"
              >
                <Sparkles className="h-7 w-7" />
              </motion.span>
              <div>
                <p className="font-display text-xl font-semibold text-foreground">
                  Yeni anı geldi! 🎉
                </p>
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Heart className="h-3.5 w-3.5 fill-rose text-rose" />
                  {bildirim.guest_name} az önce paylaştı
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sayaç */}
      <div className="absolute right-6 top-1/2 hidden -translate-y-1/2 text-right text-white/80 sm:block sm:right-10">
        <p className="font-display text-6xl font-semibold drop-shadow-lg">
          {slaytlar.length}
        </p>
        <p className="text-sm uppercase tracking-widest">anı</p>
      </div>
    </div>
  );
}
