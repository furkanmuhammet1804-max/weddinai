import {
  QrCode,
  Images,
  MonitorPlay,
  ShieldCheck,
  Mic,
  BarChart3,
  Camera,
  Sparkles,
  Cake,
  Building2,
  Flower2,
  PartyPopper,
} from "lucide-react";
import { SiteNav } from "@/components/site/site-nav";
import { SiteFooter } from "@/components/site/site-footer";
import { Hero } from "@/components/site/hero";
import { Istatistikler } from "@/components/site/istatistik";
import { Reveal } from "@/components/site/reveal";
import { SSS } from "@/components/site/sss";
import { ButtonLink } from "@/components/ui/button";

const ozellikler = [
  {
    icon: QrCode,
    baslik: "Dinamik QR Kod Motoru",
    aciklama:
      "Renklerini, logonuzu ve çerçevenizi özelleştirin, baskıya hazır yüksek çözünürlüklü PDF olarak indirin.",
  },
  {
    icon: Images,
    baslik: "Gerçek Zamanlı Medya Merkezi",
    aciklama:
      "Pinterest tarzı akıcı galeride tüm fotoğraf, video ve anıları görün; toplu indirin veya silin.",
  },
  {
    icon: MonitorPlay,
    baslik: "Canlı Slayt Gösterisi",
    aciklama:
      "Misafir fotoğraf yüklediği an, büyük ekrana zarif animasyonlarla anında düşsün. Asıl WOW etkisi.",
  },
  {
    icon: ShieldCheck,
    baslik: "Akıllı Moderasyon",
    aciklama:
      "İster direkt yayınlayın, ister onay sistemini açın. Yayına neyin çıkacağına siz karar verin.",
  },
  {
    icon: Mic,
    baslik: "Sesli & Yazılı Anı Defteri",
    aciklama:
      "Misafirleriniz içten notlar yazsın veya tarayıcıdan doğrudan sesli mesaj bıraksın.",
  },
  {
    icon: BarChart3,
    baslik: "Analiz Paneli",
    aciklama:
      "Toplam yükleme, en aktif saatler ve en aktif misafirler — zarif grafiklerle.",
  },
];

const adimlar = [
  {
    no: "01",
    icon: Sparkles,
    baslik: "Etkinliğinizi oluşturun",
    aciklama: "Türünü seçin, tarihini girin, temasını belirleyin. Dakikalar içinde hazır.",
  },
  {
    no: "02",
    icon: QrCode,
    baslik: "QR kodu paylaşın",
    aciklama: "Masalara koyun, davetiyeye basın veya ekrana yansıtın. Misafir okutsun.",
  },
  {
    no: "03",
    icon: Camera,
    baslik: "Anılar buluta aksın",
    aciklama: "Misafirleriniz uygulama indirmeden yükler; siz canlı izler, indirir, saklarsınız.",
  },
];

const ETKINLIK_TONE = "from-primary to-primary-deep";
const etkinlikTurleri = [
  { icon: Sparkles, ad: "Lüks Düğün", tone: ETKINLIK_TONE },
  { icon: Flower2, ad: "Kına Gecesi", tone: ETKINLIK_TONE },
  { icon: Building2, ad: "Kurumsal Gala", tone: ETKINLIK_TONE },
  { icon: Cake, ad: "Doğum Günü", tone: ETKINLIK_TONE },
  { icon: PartyPopper, ad: "Nişan & Söz", tone: ETKINLIK_TONE },
];

export default function Home() {
  return (
    <>
      <SiteNav />
      <main className="flex-1">
        <Hero />

        {/* İSTATİSTİKLER (animasyonlu sayaç) */}
        <Istatistikler />

        {/* ÖZELLİKLER */}
        <section id="ozellikler" className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium uppercase tracking-widest text-primary-deep">
              Özellikler
            </p>
            <h2 className="font-display mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Premium bir deneyim için ihtiyacınız olan her şey
            </h2>
            <p className="mt-4 text-muted-foreground">
              Misafirden ekrana, ilk taramadan son indirmeye kadar kusursuz bir akış.
            </p>
          </Reveal>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {ozellikler.map((o, i) => {
              const Icon = o.icon;
              return (
                <Reveal key={o.baslik} delay={i * 0.07}>
                  <div className="group h-full rounded-2xl border border-border bg-card p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary-deep transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="h-6 w-6" />
                    </span>
                    <h3 className="font-display mt-5 text-lg font-semibold">
                      {o.baslik}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {o.aciklama}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* NASIL ÇALIŞIR */}
        <section id="nasil-calisir" className="bg-card/60 py-20">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <Reveal className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-medium uppercase tracking-widest text-primary-deep">
                Nasıl Çalışır
              </p>
              <h2 className="font-display mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Üç adımda anılarınız hazır
              </h2>
            </Reveal>

            <div className="mt-14 grid gap-8 md:grid-cols-3">
              {adimlar.map((a, i) => {
                const Icon = a.icon;
                return (
                  <Reveal key={a.no} delay={i * 0.12}>
                    <div className="relative rounded-2xl border border-border bg-background p-8">
                      <span className="font-display absolute right-6 top-5 text-5xl font-semibold text-primary-soft">
                        {a.no}
                      </span>
                      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-elegant">
                        <Icon className="h-6 w-6" />
                      </span>
                      <h3 className="font-display mt-5 text-lg font-semibold">
                        {a.baslik}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {a.aciklama}
                      </p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* ETKİNLİK TÜRLERİ */}
        <section id="etkinlikler" className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium uppercase tracking-widest text-primary-deep">
              Her An İçin
            </p>
            <h2 className="font-display mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Hangi etkinliği kutluyorsunuz?
            </h2>
          </Reveal>

          <div className="mt-12 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
            {etkinlikTurleri.map((e, i) => {
              const Icon = e.icon;
              return (
                <Reveal key={e.ad} delay={i * 0.06}>
                  <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant">
                    <div
                      className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${e.tone} text-white shadow-elegant`}
                    >
                      <Icon className="h-7 w-7" />
                    </div>
                    <p className="font-display mt-4 font-semibold">{e.ad}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* SSS */}
        <SSS />

        {/* CTA */}
        <section className="mx-auto max-w-7xl px-5 pb-8 sm:px-8">
          <Reveal>
            <div className="bg-aura relative overflow-hidden rounded-3xl border border-border bg-card px-8 py-16 text-center shadow-elegant sm:px-16">
              <h2 className="font-display mx-auto max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
                Bir sonraki etkinliğinizi{" "}
                <span className="text-gradient-gold">unutulmaz</span> kılın
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                Anılar güvende, kontrol sizde. Vitrini keşfedin ya da size verilen
                oda koduyla kendi etkinliğinize giriş yapın.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <ButtonLink href="/showroom" size="lg">
                  Showroom&apos;u Keşfet
                </ButtonLink>
                <ButtonLink href="/musteri" variant="outline" size="lg">
                  Müşteri Girişi
                </ButtonLink>
              </div>
            </div>
          </Reveal>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
