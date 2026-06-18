import type { Metadata } from "next";
import Link from "next/link";
import {
  Smartphone,
  Music,
  Timer,
  MapPin,
  QrCode,
  Heart,
  MessageCircle,
  ArrowRight,
  CalendarHeart,
} from "lucide-react";
import { SiteNav } from "@/components/site/site-nav";
import { SiteFooter } from "@/components/site/site-footer";

export const metadata: Metadata = {
  title: "Dijital Düğün ve Kına Davetiyesi — WeddinAI",
  description:
    "Düğününüz için size özel hazırlanmış premium dijital davetiye. Mobil uyumlu, müzikli açılış, geri sayım, harita, RSVP, QR kod ve WhatsApp paylaşımı.",
  alternates: { canonical: "/davetiye" },
  openGraph: {
    title: "Dijital Düğün ve Kına Davetiyesi — WeddinAI",
    description:
      "Size özel premium dijital davetiye: müzikli açılış, geri sayım, harita, RSVP ve daha fazlası.",
    url: "/davetiye",
  },
};

const ozellikler = [
  { ikon: Smartphone, baslik: "Mobil uyumlu", metin: "Her cihazda kusursuz görünüm." },
  { ikon: Music, baslik: "Müzikli açılış", metin: "Ziyaretçi tek dokunuşla müziği başlatır." },
  { ikon: Timer, baslik: "Geri sayım", metin: "Büyük güne kalan süre canlı." },
  { ikon: CalendarHeart, baslik: "Kına & düğün bilgileri", metin: "Tüm organizasyonlar tek davetiyede." },
  { ikon: MapPin, baslik: "Harita entegrasyonu", metin: "Tek tıkla yol tarifi." },
  { ikon: Heart, baslik: "RSVP", metin: "Katılım bildirimi toplayın." },
  { ikon: QrCode, baslik: "QR kod", metin: "Baskıya hazır QR ile paylaşım." },
  { ikon: MessageCircle, baslik: "WhatsApp paylaşımı", metin: "Davetiyenizi saniyeler içinde gönderin." },
];

export default function DavetiyePage() {
  return (
    <>
      <SiteNav />
      <main>
        {/* Hero */}
        <section className="bg-aura px-5 py-16 text-center sm:px-8 sm:py-24">
          <div className="mx-auto max-w-3xl">
            <p className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary-soft/50 px-3 py-1 text-xs font-medium text-primary-deep">
              <Heart className="h-3 w-3" /> WeddinAI Dijital Davetiye
            </p>
            <h1 className="font-display mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
              Dijital Düğün ve Kına Davetiyesi
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
              Düğününüz için size özel hazırlanmış premium dijital davetiyenizi
              oluşturuyoruz.
            </p>
            <Link
              href="/davetiye/talep"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-elegant transition-all hover:brightness-110"
            >
              Davetiye Talebi Oluştur <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* Özellikler */}
        <section className="mx-auto max-w-5xl px-5 py-16 sm:px-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ozellikler.map((o) => (
              <div key={o.baslik} className="rounded-2xl border border-border bg-card/70 p-5 shadow-sm">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary-deep">
                  <o.ikon className="h-5 w-5" />
                </span>
                <h3 className="mt-3 font-display font-semibold">{o.baslik}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{o.metin}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-3xl border border-border bg-card/60 p-8 text-center">
            <h2 className="font-display text-2xl font-semibold">Hazır mısınız?</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Bilgilerinizi doldurun; ödeme ve tasarım için ekibimiz sizinle
              iletişime geçsin. Davetiyeniz onaylanınca size özel bağlantınız hazır.
            </p>
            <Link
              href="/davetiye/talep"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-elegant transition-all hover:brightness-110"
            >
              Davetiye Talebi Oluştur <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
