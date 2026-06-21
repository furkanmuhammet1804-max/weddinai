"use client";

// =============================================================
// Ana sayfa HERO — Premium Redesign V4.
// Telefon mockup KALDIRILDI. Yerine: gerçek Unsplash düğün görsellerinden
// katmanlı floating collage + glassmorphism canlı kartlar + QR akış + AI rozetleri.
// Arka plan: ivory/champagne/soft-gold + blur bokeh. Animasyonlar CSS transform
// (globals.css: wai-float / wai-bokeh) — GSAP yok, CLS yok, reduced-motion'da kapanır.
// =============================================================
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  PlayCircle,
  QrCode,
  Upload,
  Images as ImagesIcon,
  GalleryHorizontalEnd,
  BookHeart,
  Heart,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

function unsplash(id: string, w = 800): string {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;
}

// Katmanlı collage — farklı oran/boyut, gerçek düğün kareleri (doğrulanmış 200).
const COLLAGE = [
  // [id, alt, konum sınıfları, z, float-gecikme, priority?]
  { id: "1606216794074-735e91aa2c92", alt: "Gelin hazırlığı", cls: "left-[6%] top-[3%] h-52 w-40 sm:h-60 sm:w-44", z: "z-20", d: "0s" },
  { id: "1519741497674-611481863552", alt: "Çift", cls: "left-[33%] top-[20%] h-60 w-44 sm:h-72 sm:w-52", z: "z-40", d: "0.8s", priority: true },
  { id: "1511285560929-80b456fea0bc", alt: "Düğün masası", cls: "right-[2%] top-[1%] h-40 w-52 sm:h-44 sm:w-60", z: "z-10", d: "1.4s" },
  { id: "1460978812857-470ed1c77af0", alt: "Yüzükler", cls: "left-[1%] top-[52%] h-32 w-32 sm:h-36 sm:w-36", z: "z-30", d: "0.4s" },
  { id: "1519225421980-715cb0215aed", alt: "İlk dans", cls: "right-[5%] top-[54%] h-40 w-48 sm:h-44 sm:w-56", z: "z-20", d: "1.1s" },
  { id: "1583939003579-730e3918a45a", alt: "Aile fotoğrafı", cls: "left-[26%] top-[72%] hidden h-28 w-40 sm:block sm:h-32 sm:w-44", z: "z-30", d: "1.8s" },
] as const;

// Glassmorphism canlı anı kartları.
const CANLI = [
  { emoji: "📸", deger: "2.481", etiket: "Fotoğraf", cls: "left-[-2%] top-[34%]", d: "0.2s" },
  { emoji: "🎥", deger: "314", etiket: "Video", cls: "right-[-1%] top-[30%]", d: "0.9s" },
  { emoji: "🎙️", deger: "82", etiket: "Sesli Anı", cls: "left-[10%] top-[6%] hidden lg:flex", d: "1.5s" },
  { emoji: "❤️", deger: "1.920", etiket: "Beğeni", cls: "right-[8%] bottom-[2%]", d: "0.6s" },
] as const;

const AI_ROZET = [
  { ikon: BookHeart, ad: "AI Hatıra Defteri" },
  { ikon: GalleryHorizontalEnd, ad: "AI Dijital Albüm" },
  { ikon: Heart, ad: "AI Tebrik Mesajları" },
  { ikon: ImagesIcon, ad: "Akıllı Medya Merkezi" },
] as const;

const QR_ADIM = [
  { ikon: QrCode, ad: "QR Tara" },
  { ikon: Upload, ad: "Yükle" },
  { ikon: ImagesIcon, ad: "Anılar Toplansın" },
  { ikon: GalleryHorizontalEnd, ad: "Albüm Oluştur" },
] as const;

export function Hero() {
  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden">
      {/* Arka plan: ivory → champagne → soft gold */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(160deg, #FBF7EF 0%, #F6ECDB 42%, #F2E3C6 100%)",
        }}
      />
      {/* Blur bokeh ışıklar */}
      <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
        <div className="wai-bokeh absolute -left-20 top-10 h-72 w-72 rounded-full bg-[#E9C77B]/40 blur-3xl" />
        <div className="wai-bokeh absolute right-[-10%] top-1/3 h-96 w-96 rounded-full bg-[#F3C9C2]/40 blur-3xl" style={{ animationDelay: "3s" }} />
        <div className="wai-bokeh absolute bottom-[-10%] left-1/3 h-80 w-80 rounded-full bg-[#EADBA6]/40 blur-3xl" style={{ animationDelay: "6s" }} />
      </div>

      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[1.04fr_0.96fr] lg:py-24">
        {/* ---------- SOL: metin ---------- */}
        <div>
          <motion.span
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-white/70 px-4 py-1.5 text-xs font-semibold text-primary-deep shadow-sm backdrop-blur"
          >
            <Sparkles className="h-3.5 w-3.5" />
            WeddinAI · Premium Düğün Anı Platformu
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.08 }}
            className="font-display mt-6 text-[2.6rem] font-semibold leading-[1.05] tracking-tight sm:text-6xl"
          >
            Düğününüzün hiçbir anı{" "}
            <span className="text-gradient-gold">kaybolmasın.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.16 }}
            className="mt-6 max-w-xl text-lg leading-relaxed text-foreground/70"
          >
            Misafirleriniz QR kod ile fotoğraf, video ve sesli anılarını
            paylaşır. Siz tüm anılarınızı tek bir yerde toplarsınız.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.24 }}
            className="mt-9 flex flex-col gap-3 sm:flex-row"
          >
            <ButtonLink href="/siparis" size="lg">
              <Sparkles className="h-4 w-4" /> Bir Etkinlik Oluştur
            </ButtonLink>
            <ButtonLink href="/showroom" variant="outline" size="lg">
              <PlayCircle className="h-4 w-4" /> Canlı Demo Gör
            </ButtonLink>
          </motion.div>

          {/* AI rozetleri */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-9 flex flex-wrap gap-2.5"
          >
            {AI_ROZET.map((r) => {
              const Icon = r.ikon;
              return (
                <span
                  key={r.ad}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-white/70 px-3.5 py-1.5 text-xs font-medium text-foreground/80 shadow-sm backdrop-blur"
                >
                  <Icon className="h-3.5 w-3.5 text-primary-deep" />
                  <span className="text-primary-deep">✨</span> {r.ad}
                </span>
              );
            })}
          </motion.div>

          {/* QR akış mini şeması */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="mt-10 flex flex-wrap items-center gap-x-2 gap-y-3"
          >
            {QR_ADIM.map((a, i) => {
              const Icon = a.ikon;
              return (
                <div key={a.ad} className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-2xl border border-border/70 bg-white/60 px-3.5 py-2 text-xs font-medium text-foreground/80 shadow-sm backdrop-blur">
                    <Icon className="h-4 w-4 text-primary-deep" /> {a.ad}
                  </span>
                  {i < QR_ADIM.length - 1 && (
                    <ArrowRight className="h-4 w-4 shrink-0 text-primary-deep/50" />
                  )}
                </div>
              );
            })}
          </motion.div>
        </div>

        {/* ---------- SAĞ: floating collage ---------- */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto h-[440px] w-full max-w-md sm:h-[560px] lg:max-w-none"
        >
          {COLLAGE.map((f) => (
            <div
              key={f.id}
              className={`wai-float absolute ${f.cls} ${f.z} overflow-hidden rounded-3xl border border-white/60 shadow-[0_20px_50px_-12px_rgba(120,90,40,0.35)] ring-1 ring-black/5`}
              style={{ animationDelay: f.d }}
            >
              <Image
                src={unsplash(f.id)}
                alt={f.alt}
                fill
                sizes="(max-width: 768px) 45vw, 22vw"
                className="object-cover"
                priority={"priority" in f && f.priority ? true : undefined}
              />
            </div>
          ))}

          {/* Glassmorphism canlı kartlar */}
          {CANLI.map((k) => (
            <div
              key={k.etiket}
              className={`wai-float-soft absolute ${k.cls} z-50 flex items-center gap-2.5 rounded-2xl border border-white/70 bg-white/55 px-3.5 py-2.5 shadow-lg backdrop-blur-md`}
              style={{ animationDelay: k.d }}
            >
              <span className="text-lg leading-none">{k.emoji}</span>
              <span className="leading-tight">
                <span className="block font-display text-sm font-semibold text-foreground">
                  +{k.deger}
                </span>
                <span className="block text-[11px] text-foreground/60">{k.etiket}</span>
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
