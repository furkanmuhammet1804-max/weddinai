"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, Heart, ArrowLeft } from "lucide-react";
import { SiteNav } from "@/components/site/site-nav";
import { SiteFooter } from "@/components/site/site-footer";

const PAKETLER: Record<string, { ad: string; fiyat: string }> = {
  baslangic: { ad: "Başlangıç", fiyat: "₺1.490" },
  standart: { ad: "Standart", fiyat: "₺2.490" },
  premium: { ad: "Premium", fiyat: "₺4.990" },
};

const TURLER = [
  { deger: "dugun", etiket: "Düğün" },
  { deger: "nisan", etiket: "Nişan" },
  { deger: "kina", etiket: "Kına Gecesi" },
  { deger: "kurumsal_gala", etiket: "Kurumsal Gala" },
  { deger: "dogum_gunu", etiket: "Doğum Günü" },
  { deger: "parti", etiket: "Parti" },
  { deger: "diger", etiket: "Diğer" },
];

export function SiparisForm({ paket }: { paket: string }) {
  const [secili, setSecili] = useState(paket);
  const [form, setForm] = useState({
    customer_name: "",
    event_type: "dugun",
    event_date: "",
    phone: "",
    email: "",
    note: "",
  });
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [bitti, setBitti] = useState(false);

  function g(alan: keyof typeof form, deger: string) {
    setForm((f) => ({ ...f, [alan]: deger }));
  }

  async function gonder(e: React.FormEvent) {
    e.preventDefault();
    if (yukleniyor) return;
    setHata(null);
    if (form.customer_name.trim().length < 2) {
      setHata("Lütfen ad soyad / çift adını girin.");
      return;
    }
    if (!form.phone.trim() && !form.email.trim()) {
      setHata("Telefon veya e-posta girin (size ulaşabilmemiz için).");
      return;
    }
    setYukleniyor(true);
    try {
      const res = await fetch("/api/siparis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, paket: secili }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setHata(data.hata ?? "Bir hata oluştu.");
        setYukleniyor(false);
        return;
      }
      setBitti(true);
    } catch {
      setHata("Bağlantı hatası. Lütfen tekrar deneyin.");
      setYukleniyor(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteNav />
      <main className="bg-aura flex-1">
        <div className="mx-auto max-w-xl px-5 py-12 sm:py-16">
          {bitti ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-3xl border border-border bg-card p-10 text-center shadow-elegant"
            >
              <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
              <h1 className="font-display mt-4 text-2xl font-semibold">
                Talebiniz alındı 💛
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                En kısa sürede sizinle iletişime geçeceğiz. Etkinliğinizin özel
                odasını birlikte hazırlayalım.
              </p>
              <Link
                href="/"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-elegant hover:brightness-110"
              >
                Ana sayfaya dön
              </Link>
            </motion.div>
          ) : (
            <>
              <Link
                href="/fiyatlar"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" /> Fiyatlar
              </Link>

              <div className="mt-4 rounded-3xl border border-border bg-card p-7 shadow-elegant sm:p-8">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-elegant">
                  <Heart className="h-6 w-6" />
                </span>
                <h1 className="font-display mt-4 text-2xl font-semibold tracking-tight">
                  Etkinlik odanızı başlatın
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Formu doldurun, sizi arayıp odanızı birlikte hazırlayalım.
                </p>

                {/* Paket seçimi */}
                <div className="mt-6 grid grid-cols-3 gap-2">
                  {Object.entries(PAKETLER).map(([k, v]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setSecili(k)}
                      className={`rounded-2xl border px-2 py-3 text-center transition-colors ${
                        secili === k
                          ? "border-primary bg-primary-soft/50"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      <span className="block text-sm font-semibold">{v.ad}</span>
                      <span className="block text-xs text-muted-foreground">
                        {v.fiyat}
                      </span>
                    </button>
                  ))}
                </div>

                <form onSubmit={gonder} className="mt-6 space-y-4">
                  <Alan
                    label="Ad Soyad / Çift Adı"
                    value={form.customer_name}
                    onChange={(v) => g("customer_name", v)}
                    placeholder="Örn. Furkan & Bengisu"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Etkinlik Türü</label>
                      <select
                        value={form.event_type}
                        onChange={(e) => g("event_type", e.target.value)}
                        className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none focus:border-primary"
                      >
                        {TURLER.map((t) => (
                          <option key={t.deger} value={t.deger}>
                            {t.etiket}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Tarih</label>
                      <input
                        type="date"
                        value={form.event_date}
                        onChange={(e) => g("event_date", e.target.value)}
                        className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                  <Alan
                    label="Telefon"
                    value={form.phone}
                    onChange={(v) => g("phone", v)}
                    placeholder="05xx xxx xx xx"
                    type="tel"
                  />
                  <Alan
                    label="E-posta (isteğe bağlı)"
                    value={form.email}
                    onChange={(v) => g("email", v)}
                    placeholder="ornek@eposta.com"
                    type="email"
                  />
                  <div>
                    <label className="text-sm font-medium">Not (isteğe bağlı)</label>
                    <textarea
                      value={form.note}
                      onChange={(e) => g("note", e.target.value)}
                      rows={3}
                      placeholder="Eklemek istedikleriniz..."
                      className="mt-2 w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                    />
                  </div>

                  {hata && (
                    <p className="rounded-xl bg-rose-soft px-4 py-2.5 text-xs font-medium text-rose">
                      {hata}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={yukleniyor}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground shadow-elegant transition-all hover:brightness-110 disabled:opacity-60"
                  >
                    {yukleniyor && <Loader2 className="h-4 w-4 animate-spin" />}
                    Talep Gönder
                  </button>
                  <p className="text-center text-xs text-muted-foreground">
                    Göndererek sizinle iletişime geçmemizi kabul edersiniz.
                  </p>
                </form>
              </div>
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Alan({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
      />
    </div>
  );
}
