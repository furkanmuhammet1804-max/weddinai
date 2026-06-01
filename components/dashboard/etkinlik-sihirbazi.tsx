"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Flower2,
  Building2,
  Cake,
  PartyPopper,
  Heart,
  ArrowLeft,
  ArrowRight,
  Check,
  ShieldCheck,
  Zap,
  CalendarHeart,
  ExternalLink,
} from "lucide-react";
import type { EtkinlikTuru } from "@/lib/mock-data";

const turler: { id: EtkinlikTuru; ad: string; icon: typeof Heart }[] = [
  { id: "dugun", ad: "Lüks Düğün", icon: Heart },
  { id: "nisan", ad: "Nişan & Söz", icon: Sparkles },
  { id: "kina", ad: "Kına Gecesi", icon: Flower2 },
  { id: "kurumsal_gala", ad: "Kurumsal Gala", icon: Building2 },
  { id: "dogum_gunu", ad: "Doğum Günü", icon: Cake },
  { id: "parti", ad: "Parti", icon: PartyPopper },
];

const temalar = [
  { id: "altin", ad: "Şampanya Altını", tone: "from-rose-soft via-primary-soft to-background" },
  { id: "gul", ad: "Pudra Gül", tone: "from-rose-soft to-rose" },
  { id: "minimal", ad: "Zarif Minimal", tone: "from-muted to-background" },
  { id: "gece", ad: "Gece Mavisi", tone: "from-primary-soft to-accent" },
];

function slugYap(s: string): string {
  const harita: Record<string, string> = {
    ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u",
  };
  return s
    .toLowerCase()
    .replace(/[çğıöşü]/g, (h) => harita[h] ?? h)
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 40);
}

const ADIMLAR = ["Tür", "Detaylar", "Tema", "Moderasyon", "Özet"];

export function EtkinlikSihirbazi() {
  const [adim, setAdim] = useState(0);
  const [tur, setTur] = useState<EtkinlikTuru | null>(null);
  const [baslik, setBaslik] = useState("");
  const [tarih, setTarih] = useState("");
  const [tema, setTema] = useState(temalar[0].id);
  const [moderasyon, setModerasyon] = useState<"direkt_yayinla" | "onay_gereksin">(
    "direkt_yayinla",
  );
  const [bitti, setBitti] = useState(false);

  const slug = slugYap(baslik) || "etkinligim";

  const ileriGidilebilir =
    (adim === 0 && tur) ||
    (adim === 1 && baslik.trim() && tarih) ||
    adim === 2 ||
    adim === 3;

  if (bitti) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-auto max-w-lg rounded-3xl border border-border bg-card p-10 text-center shadow-elegant"
      >
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 14 }}
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-primary"
        >
          <Check className="h-9 w-9" />
        </motion.span>
        <h2 className="font-display mt-5 text-2xl font-semibold">
          Etkinliğiniz oluşturuldu! 🎉
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{baslik}</span> artık
          yayında. Misafir bağlantınız hazır:
        </p>
        <div className="mt-4 rounded-xl bg-muted px-4 py-3 text-sm text-primary-deep">
          weddinai.com/e/{slug}
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href={`/e/${slug}`}
            target="_blank"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-primary/40 py-3 text-sm font-medium hover:bg-primary-soft/50"
          >
            <ExternalLink className="h-4 w-4" /> Misafir Sayfası
          </Link>
          <Link
            href="/panel/qr"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground shadow-elegant hover:brightness-110"
          >
            QR Kodu Oluştur
          </Link>
        </div>
        <Link
          href="/panel/etkinlikler"
          className="mt-4 inline-block text-xs text-muted-foreground hover:text-foreground"
        >
          Etkinliklere dön
        </Link>
      </motion.div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* İlerleme */}
      <div className="flex items-center justify-between">
        {ADIMLAR.map((a, i) => (
          <div key={a} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                  i < adim
                    ? "bg-primary text-primary-foreground"
                    : i === adim
                      ? "bg-primary text-primary-foreground ring-4 ring-primary-soft"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {i < adim ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span
                className={`mt-1.5 hidden text-[11px] sm:block ${i === adim ? "font-medium text-foreground" : "text-muted-foreground"}`}
              >
                {a}
              </span>
            </div>
            {i < ADIMLAR.length - 1 && (
              <div
                className={`mx-1 h-0.5 flex-1 rounded-full ${i < adim ? "bg-primary" : "bg-muted"}`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-3xl border border-border bg-card p-7 shadow-elegant">
        <AnimatePresence mode="wait">
          <motion.div
            key={adim}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.3 }}
          >
            {/* Adım 0: tür */}
            {adim === 0 && (
              <>
                <h2 className="font-display text-xl font-semibold">
                  Ne kutluyorsunuz?
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Etkinlik türünüzü seçin, temayı buna göre hazırlayalım.
                </p>
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {turler.map((t) => {
                    const Icon = t.icon;
                    const secili = tur === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setTur(t.id)}
                        className={`flex flex-col items-center gap-2 rounded-2xl border p-5 transition-all ${
                          secili
                            ? "border-primary bg-primary-soft/40 ring-2 ring-primary/20"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        <Icon
                          className={`h-7 w-7 ${secili ? "text-primary" : "text-muted-foreground"}`}
                        />
                        <span className="text-sm font-medium">{t.ad}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* Adım 1: detaylar */}
            {adim === 1 && (
              <>
                <h2 className="font-display text-xl font-semibold">
                  Etkinlik detayları
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Başlık ve tarih girin. Özel bağlantınızı otomatik oluşturalım.
                </p>
                <label className="mt-5 block text-sm font-medium">
                  Etkinlik başlığı
                </label>
                <input
                  value={baslik}
                  onChange={(e) => setBaslik(e.target.value)}
                  placeholder="Örn. Elif & Mert Düğünü"
                  className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                />
                <label className="mt-4 block text-sm font-medium">
                  Etkinlik tarihi
                </label>
                <input
                  type="date"
                  value={tarih}
                  onChange={(e) => setTarih(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                />
                {baslik.trim() && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl bg-muted px-4 py-3 text-xs text-muted-foreground">
                    <CalendarHeart className="h-3.5 w-3.5 text-primary" />
                    Bağlantınız:{" "}
                    <span className="font-medium text-primary-deep">
                      weddinai.com/e/{slug}
                    </span>
                  </div>
                )}
              </>
            )}

            {/* Adım 2: tema */}
            {adim === 2 && (
              <>
                <h2 className="font-display text-xl font-semibold">
                  Tema seçin
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Misafir sayfanızın görünümünü belirleyin.
                </p>
                <div className="mt-5 grid grid-cols-2 gap-4">
                  {temalar.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTema(t.id)}
                      className={`overflow-hidden rounded-2xl border text-left transition-all ${
                        tema === t.id
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      <div className={`h-20 bg-gradient-to-br ${t.tone}`} />
                      <div className="flex items-center justify-between px-4 py-3">
                        <span className="text-sm font-medium">{t.ad}</span>
                        {tema === t.id && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Adım 3: moderasyon */}
            {adim === 3 && (
              <>
                <h2 className="font-display text-xl font-semibold">
                  Moderasyon modu
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Yüklenen içerik nasıl yayınlansın?
                </p>
                <div className="mt-5 space-y-3">
                  <button
                    onClick={() => setModerasyon("direkt_yayinla")}
                    className={`flex w-full items-start gap-4 rounded-2xl border p-5 text-left transition-all ${
                      moderasyon === "direkt_yayinla"
                        ? "border-primary bg-primary-soft/40 ring-2 ring-primary/20"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <Zap className="mt-0.5 h-6 w-6 text-primary" />
                    <div>
                      <p className="font-medium">Direkt Yayınla</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        Yüklenen her şey anında galeride ve canlı slaytta görünür.
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => setModerasyon("onay_gereksin")}
                    className={`flex w-full items-start gap-4 rounded-2xl border p-5 text-left transition-all ${
                      moderasyon === "onay_gereksin"
                        ? "border-primary bg-primary-soft/40 ring-2 ring-primary/20"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <ShieldCheck className="mt-0.5 h-6 w-6 text-primary" />
                    <div>
                      <p className="font-medium">Onay Gereksin</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        İçerik siz onaylayana kadar yayına çıkmaz. Tam kontrol.
                      </p>
                    </div>
                  </button>
                </div>
              </>
            )}

            {/* Adım 4: özet */}
            {adim === 4 && (
              <>
                <h2 className="font-display text-xl font-semibold">
                  Her şey hazır mı?
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Etkinliğinizi gözden geçirin ve oluşturun.
                </p>
                <div className="mt-5 space-y-3 rounded-2xl bg-muted/60 p-5 text-sm">
                  {[
                    ["Tür", turler.find((t) => t.id === tur)?.ad ?? "-"],
                    ["Başlık", baslik || "-"],
                    ["Tarih", tarih || "-"],
                    ["Tema", temalar.find((t) => t.id === tema)?.ad ?? "-"],
                    [
                      "Moderasyon",
                      moderasyon === "direkt_yayinla"
                        ? "Direkt Yayınla"
                        : "Onay Gereksin",
                    ],
                    ["Bağlantı", `weddinai.com/e/${slug}`],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="text-right font-medium">{v}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigasyon */}
        <div className="mt-7 flex items-center justify-between">
          {adim > 0 ? (
            <button
              onClick={() => setAdim((a) => a - 1)}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-foreground/70 hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" /> Geri
            </button>
          ) : (
            <Link
              href="/panel/etkinlikler"
              className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-foreground/70 hover:bg-muted"
            >
              İptal
            </Link>
          )}

          {adim < ADIMLAR.length - 1 ? (
            <button
              onClick={() => setAdim((a) => a + 1)}
              disabled={!ileriGidilebilir}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-elegant transition-all hover:brightness-110 disabled:opacity-40"
            >
              Devam <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => setBitti(true)}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-elegant transition-all hover:brightness-110"
            >
              <Check className="h-4 w-4" /> Etkinliği Oluştur
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
