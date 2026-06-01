"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Heart,
  Lock,
  Loader2,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";

const TURLER: { deger: string; etiket: string }[] = [
  { deger: "dugun", etiket: "Düğün" },
  { deger: "nisan", etiket: "Nişan" },
  { deger: "kina", etiket: "Kına Gecesi" },
  { deger: "kurumsal_gala", etiket: "Kurumsal Gala" },
  { deger: "dogum_gunu", etiket: "Doğum Günü" },
  { deger: "parti", etiket: "Parti" },
  { deger: "diger", etiket: "Diğer" },
];

export function OdaOlustur() {
  const router = useRouter();
  const [form, setForm] = useState({
    baslik: "",
    musteri: "",
    tur: "dugun",
    tarih: "",
    sifre: "",
  });
  const [goster, setGoster] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  function guncelle(alan: keyof typeof form, deger: string) {
    setForm((f) => ({ ...f, [alan]: deger }));
  }

  async function gonder(e: React.FormEvent) {
    e.preventDefault();
    if (yukleniyor) return;
    setHata(null);
    if (form.baslik.trim().length < 2) {
      setHata("Lütfen oda başlığını girin (örn. Furkan & Bengisu).");
      return;
    }
    if (form.sifre.length < 4) {
      setHata("Oda şifresi en az 4 karakter olmalı.");
      return;
    }
    setYukleniyor(true);
    try {
      const res = await fetch("/api/panel/oda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setHata(data.hata ?? "Oda oluşturulamadı.");
        setYukleniyor(false);
        return;
      }
      router.push(`/panel/oda/${data.id}`);
    } catch {
      setHata("Bağlantı hatası. Lütfen tekrar deneyin.");
      setYukleniyor(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <Link
        href="/panel"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Odalar
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 rounded-3xl border border-border bg-card p-7 shadow-elegant"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-elegant">
          <Heart className="h-6 w-6" />
        </span>
        <h1 className="font-display mt-4 text-2xl font-semibold tracking-tight">
          Yeni Oda
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Müşterin için gizli, şifreli bir etkinlik odası oluştur.
        </p>

        <form onSubmit={gonder} className="mt-6 space-y-4">
          <Alan
            label="Oda Başlığı"
            ipucu="Örn. Furkan & Bengisu"
            value={form.baslik}
            onChange={(v) => guncelle("baslik", v)}
            autoFocus
          />
          <Alan
            label="Müşteri Adı (isteğe bağlı)"
            ipucu="Örn. Furkan Yılmaz"
            value={form.musteri}
            onChange={(v) => guncelle("musteri", v)}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Etkinlik Türü</label>
              <select
                value={form.tur}
                onChange={(e) => guncelle("tur", e.target.value)}
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
              <label className="text-sm font-medium">Tarih (isteğe bağlı)</label>
              <input
                type="date"
                value={form.tarih}
                onChange={(e) => guncelle("tarih", e.target.value)}
                className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Oda Şifresi</label>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Müşteri bu şifreyle odasına girecek. Onunla paylaşacaksın.
            </p>
            <div className="relative mt-2">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type={goster ? "text" : "password"}
                value={form.sifre}
                onChange={(e) => guncelle("sifre", e.target.value)}
                placeholder="En az 4 karakter"
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
            {yukleniyor ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Odayı Oluştur
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function Alan({
  label,
  ipucu,
  value,
  onChange,
  autoFocus,
}: {
  label: string;
  ipucu?: string;
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
}) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={ipucu}
        autoFocus={autoFocus}
        className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
      />
    </div>
  );
}
