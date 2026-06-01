"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Loader2, Heart, Eye, EyeOff } from "lucide-react";

// Müşteri oda şifre kapısı. Doğru şifrede sunucu çerezi kurulur ve
// router.refresh() ile aynı sayfa panel olarak yeniden render edilir.
export function OdaGiris({ slug, baslik }: { slug: string; baslik: string }) {
  const router = useRouter();
  const [sifre, setSifre] = useState("");
  const [goster, setGoster] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  async function gonder(e: React.FormEvent) {
    e.preventDefault();
    if (yukleniyor) return;
    setHata(null);
    if (!sifre) {
      setHata("Lütfen oda şifresini girin.");
      return;
    }
    setYukleniyor(true);
    try {
      const res = await fetch("/api/oda/giris", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, sifre }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setHata(data.hata ?? "Giriş başarısız.");
        setYukleniyor(false);
        return;
      }
      // Çerez kuruldu → sunucu bileşeni paneli render etsin.
      router.refresh();
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
        <div className="flex flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-elegant">
            <Heart className="h-7 w-7" />
          </span>
          <p className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary-soft/50 px-3 py-1 text-xs font-medium text-primary-deep">
            <Lock className="h-3 w-3" /> Özel Oda
          </p>
          <h1 className="font-display mt-4 text-2xl font-semibold tracking-tight">
            {baslik}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Bu odanın içeriğini görmek için size verilen oda şifresini girin.
          </p>
        </div>

        <form onSubmit={gonder} className="mt-7 space-y-4">
          <div>
            <label className="text-sm font-medium">Oda Şifresi</label>
            <div className="relative mt-2">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type={goster ? "text" : "password"}
                value={sifre}
                onChange={(e) => setSifre(e.target.value)}
                placeholder="••••••••"
                autoFocus
                className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-10 text-sm outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setGoster((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Şifreyi göster"
              >
                {goster ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
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
            {yukleniyor && <Loader2 className="h-4 w-4 animate-spin" />}
            Odaya Gir
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <span className="font-display">WeddinAI</span> · güvenli & gizli oda
        </p>
      </motion.div>
    </div>
  );
}
