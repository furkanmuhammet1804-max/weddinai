import Link from "next/link";
import type { Metadata } from "next";
import { Check, Sparkles, Star, Crown, Camera, ArrowRight } from "lucide-react";
import { SiteNav } from "@/components/site/site-nav";
import { SiteFooter } from "@/components/site/site-footer";

export const metadata: Metadata = {
  title: "Fiyatlar — WeddinAI",
  description:
    "Düğün, nişan ve etkinlikleriniz için WeddinAI paketleri. Sınırsız misafir, canlı slayt, showroom ve toplu indirme.",
};

interface Paket {
  ad: string;
  fiyat: string;
  vurgu?: boolean;
  icon: typeof Star;
  aciklama: string;
  ozellikler: string[];
}

const paketler: Paket[] = [
  {
    ad: "Başlangıç",
    fiyat: "₺1.490",
    icon: Camera,
    aciklama: "Küçük ve samimi etkinlikler için.",
    ozellikler: [
      "Sınırsız misafir",
      "300 fotoğraf & video",
      "Sesli & yazılı anı defteri",
      "QR kod baskı şablonları",
      "30 gün boyunca indirme",
    ],
  },
  {
    ad: "Standart",
    fiyat: "₺2.490",
    vurgu: true,
    icon: Star,
    aciklama: "En çok tercih edilen — düğünler için ideal.",
    ozellikler: [
      "Başlangıç'taki her şey",
      "Sınırsız fotoğraf & video",
      "Canlı düğün slaytı (salon ekranı)",
      "Showroom vitrini",
      "Toplu (ZIP) indirme",
      "90 gün boyunca indirme",
    ],
  },
  {
    ad: "Premium",
    fiyat: "₺4.990",
    icon: Crown,
    aciklama: "Kusursuz ve ömürlük deneyim.",
    ozellikler: [
      "Standart'taki her şey",
      "AI özet video (highlight)",
      "Ömür boyu arşiv",
      "Çoklu dil desteği",
      "Özel marka & logo",
      "Öncelikli destek",
    ],
  },
];

export default function FiyatlarPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteNav />

      <main className="flex-1">
        {/* Başlık */}
        <section className="bg-aura relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-rose-soft/60 via-primary-soft/40 to-background" />
          <div className="relative mx-auto max-w-3xl px-5 pb-12 pt-16 text-center sm:pt-20">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card/70 px-4 py-1.5 text-xs font-medium text-primary-deep">
              <Sparkles className="h-3.5 w-3.5" /> Net ve şeffaf fiyatlar
            </span>
            <h1 className="font-display mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
              Etkinliğinize uygun paketi seçin
            </h1>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              Her paket tek bir etkinlik içindir. Misafirler uygulama indirmeden,
              QR ile saniyeler içinde anılarını paylaşır.
            </p>
          </div>
        </section>

        {/* Paketler */}
        <section className="mx-auto -mt-4 max-w-6xl px-5 pb-16 sm:px-8">
          <div className="grid gap-6 lg:grid-cols-3">
            {paketler.map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.ad}
                  className={`relative flex flex-col rounded-3xl border bg-card p-7 shadow-sm transition-all ${
                    p.vurgu
                      ? "border-primary shadow-elegant lg:-translate-y-3"
                      : "border-border"
                  }`}
                >
                  {p.vurgu && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground shadow-elegant">
                      En Popüler
                    </span>
                  )}
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary-deep">
                    <Icon className="h-6 w-6" />
                  </span>
                  <h3 className="font-display mt-4 text-xl font-semibold">
                    {p.ad}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {p.aciklama}
                  </p>
                  <div className="mt-5 flex items-end gap-1.5">
                    <span className="font-display text-4xl font-semibold">
                      {p.fiyat}
                    </span>
                    <span className="mb-1 text-sm text-muted-foreground">
                      / etkinlik
                    </span>
                  </div>

                  <ul className="mt-6 flex-1 space-y-3">
                    {p.ozellikler.map((o) => (
                      <li key={o} className="flex items-start gap-2.5 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span className="text-foreground/85">{o}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/kayit"
                    className={`mt-7 inline-flex items-center justify-center gap-2 rounded-full py-3 text-sm font-medium transition-all ${
                      p.vurgu
                        ? "bg-primary text-primary-foreground shadow-elegant hover:brightness-110"
                        : "border border-primary/40 text-primary-deep hover:bg-primary-soft/50"
                    }`}
                  >
                    Hemen Başla <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              );
            })}
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Tüm paketlerde verileriniz şifreli ve size özeldir. KVKK uyumlu,
            gizli oda yapısı.
          </p>
        </section>

        {/* Bayi / ortaklık */}
        <section className="mx-auto max-w-5xl px-5 pb-20 sm:px-8">
          <div className="overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary-soft/60 to-rose-soft/40 p-8 sm:p-12">
            <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
              <div className="max-w-xl">
                <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                  Fotoğrafçı veya organizatör müsünüz?
                </h2>
                <p className="mt-2 text-sm text-foreground/80 sm:text-base">
                  WeddinAI&apos;ı kendi markanızla müşterilerinize sunun. Özel
                  toptan fiyatlar ve ortaklık komisyonu için bizimle iletişime
                  geçin.
                </p>
              </div>
              <Link
                href="/kayit"
                className="inline-flex shrink-0 items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-elegant transition-all hover:brightness-110"
              >
                Bayi Ol <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
