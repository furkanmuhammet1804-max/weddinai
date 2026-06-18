"use client";

import { motion } from "framer-motion";
import { QrCode, Sparkles, Camera, Mic, Heart, Video } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

const yuzenKartlar = [
  { tone: "from-rose to-primary-soft", icon: Camera, etiket: "Fotoğraf", x: "-8%", y: "6%", delay: 0 },
  { tone: "from-primary-soft to-accent", icon: Mic, etiket: "Sesli Anı", x: "70%", y: "-4%", delay: 0.4 },
  { tone: "from-accent to-primary", icon: Heart, etiket: "+128 beğeni", x: "78%", y: "62%", delay: 0.8 },
  { tone: "from-rose-soft to-accent", icon: Video, etiket: "Video", x: "-6%", y: "66%", delay: 1.2 },
];

export function Hero() {
  return (
    <section className="bg-aura relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-16 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:pb-28 lg:pt-24">
        {/* Sol: metin */}
        <div>
          <motion.span
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card/60 px-4 py-1.5 text-xs font-medium text-primary-deep shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Türkiye&apos;nin en zarif etkinlik anı platformu
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-display mt-6 text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl"
          >
            Özel gününüzün her anı,{" "}
            <span className="text-gradient-gold">tek bir bulutta.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground"
          >
            Misafirleriniz QR kodu okutsun, uygulama indirmeden fotoğraf, video
            ve sesli anılarını saniyeler içinde paylaşsın. Siz de hepsini canlı
            olarak büyük ekranda izleyin.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-9 flex flex-col gap-3 sm:flex-row"
          >
            <ButtonLink href="/showroom" size="lg">
              <QrCode className="h-4 w-4" />
              Showroom&apos;u Keşfet
            </ButtonLink>
            <ButtonLink href="/musteri" variant="outline" size="lg">
              Müşteri Girişi
            </ButtonLink>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="mt-10 flex items-center gap-6 text-sm text-muted-foreground"
          >
            <div>
              <span className="font-display text-2xl font-semibold text-foreground">
                12.4K+
              </span>
              <p>Paylaşılan anı</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <span className="font-display text-2xl font-semibold text-foreground">
                850+
              </span>
              <p>Mutlu etkinlik</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <span className="font-display text-2xl font-semibold text-foreground">
                4.9
              </span>
              <p>Memnuniyet puanı</p>
            </div>
          </motion.div>
        </div>

        {/* Sağ: görsel kompozisyon */}
        <div className="relative h-[420px] sm:h-[500px]">
          {/* Telefon kartı */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-1/2 top-1/2 h-[440px] w-[230px] -translate-x-1/2 -translate-y-1/2 rounded-[2.2rem] border border-border bg-card p-3 shadow-elegant"
          >
            <div className="flex h-full flex-col overflow-hidden rounded-[1.6rem] bg-gradient-to-b from-rose-soft via-primary-soft to-background">
              <div className="px-4 pt-6 text-center">
                <p className="font-display text-lg font-semibold">Bengisu & Furkan</p>
                <p className="text-xs text-muted-foreground">15 Ağustos 2026</p>
              </div>
              <div className="mt-4 grid flex-1 grid-cols-2 gap-2 px-4">
                {["from-rose to-primary-soft", "from-accent to-primary", "from-primary-soft to-accent", "from-muted to-rose"].map(
                  (t, i) => (
                    <div
                      key={i}
                      className={`rounded-xl bg-gradient-to-br ${t}`}
                    />
                  ),
                )}
              </div>
              <div className="m-4 rounded-2xl bg-primary py-3 text-center text-sm font-medium text-primary-foreground">
                Anı Yükle
              </div>
            </div>
          </motion.div>

          {/* Yüzen kartlar */}
          {yuzenKartlar.map((k, i) => {
            const Icon = k.icon;
            return (
              <motion.div
                key={i}
                style={{ left: k.x, top: k.y }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
                transition={{
                  opacity: { duration: 0.6, delay: 0.6 + i * 0.15 },
                  scale: { duration: 0.6, delay: 0.6 + i * 0.15 },
                  y: { duration: 4 + i, repeat: Infinity, ease: "easeInOut", delay: k.delay },
                }}
                className="absolute flex items-center gap-2.5 rounded-2xl border border-border bg-card/90 px-4 py-3 shadow-elegant backdrop-blur"
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${k.tone} text-white`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-sm font-medium">{k.etiket}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
