"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, KeyRound, Eye, EyeOff, Loader2, Heart } from "lucide-react";
import { Logo } from "@/components/site/logo";
import { slugYap } from "@/lib/slug";

// Genel müşteri girişi: oda kodu + şifre. Doğru olunca odasına yönlenir.
// (Müşteri özel linkini de kullanabilir; bu sayfa kodla giriş alternatifidir.)
export function MusteriGirisi() {
  const [form, setForm] = useState({ kod: "", sifre: "" });
  const [goster, setGoster] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  async function gonder(e: React.FormEvent) {
    e.preventDefault();
    if (yukleniyor) return;
    setHata(null);
    // Oda kodu bir slug; kullanıcı tam link yapıştırsa bile son parçayı al.
    let kod = form.kod.trim();
    const egikIndex = kod.lastIndexOf("/");
    if (egikIndex >= 0) kod = kod.slice(egikIndex + 1);
    kod = slugYap(kod);
    if (!kod) {
      setHata("Lütfen oda kodunu girin.");
      return;
    }
    if (!form.sifre) {
      setHata("Lütfen oda şifresini girin.");
      return;
    }
    setYukleniyor(true);
    try {
      const res = await fetch("/api/oda/giris", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: kod, sifre: form.sifre }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setHata(data.hata ?? "Giriş başarısız. Oda kodu veya şifre hatalı.");
        setYukleniyor(false);
        return;
      }
      window.location.assign(`/oda/${data.slug ?? kod}`);
    } catch {
      setHata("Bağlantı hatası. Lütfen tekrar deneyin.");
      setYukleniyor(false);
    }
  }

  return (
    <div className="bg-aura flex min-h-screen items-center justify-center px-5 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm rounded-3xl border border-border bg-card/80 p-8 shadow-elegant backdrop-blur"
      >
        <Logo className="justify-center" imgClassName="h-9" />

        <div className="mt-6 text-center">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary-soft/50 px-3 py-1 text-xs font-medium text-primary-deep">
            <Lock className="h-3 w-3" /> Müşteri Girişi
          </p>
          <h1 className="font-display mt-3 text-2xl font-semibold tracking-tight">
            Odana Giriş Yap
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Sana verilen oda kodu ve şifre ile kendi etkinlik odana ulaş.
          </p>
        </div>

        <form onSubmit={gonder} className="mt-7 space-y-4">
          <div>
            <label className="text-sm font-medium">Oda Kodu</label>
            <div className="relative mt-2">
              <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={form.kod}
                onChange={(e) => setForm((f) => ({ ...f, kod: e.target.value }))}
                placeholder="örn. furkan-bengisu-3f2a"
                autoFocus
                className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Oda Şifresi</label>
            <div className="relative mt-2">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type={goster ? "text" : "password"}
                value={form.sifre}
                onChange={(e) => setForm((f) => ({ ...f, sifre: e.target.value }))}
                placeholder="••••••••"
                className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-10 text-sm outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setGoster((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Şifreyi göster"
              >
                {goster ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
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
            {yukleniyor ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Heart className="h-4 w-4" />
            )}
            Odaya Gir
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Sana özel link verildiyse doğrudan o linki de açabilirsin.
        </p>
      </motion.div>
    </div>
  );
}
