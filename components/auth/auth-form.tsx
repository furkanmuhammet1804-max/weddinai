"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import {
  Cloud,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Sparkles,
  Quote,
  Loader2,
} from "lucide-react";

type Mod = "giris" | "kayit";

export function AuthForm({ mod }: { mod: Mod }) {
  const [sifreGoster, setSifreGoster] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [form, setForm] = useState({ ad: "", email: "", sifre: "" });
  const [hata, setHata] = useState<string | null>(null);

  async function gonder(e: React.FormEvent) {
    e.preventDefault();
    setHata(null);
    if (mod === "kayit" && form.ad.trim().length < 2) {
      setHata("Lütfen adınızı ve soyadınızı girin.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setHata("Geçerli bir e-posta adresi girin.");
      return;
    }
    if (form.sifre.length < 6) {
      setHata("Şifreniz en az 6 karakter olmalı.");
      return;
    }

    setYukleniyor(true);
    const supabase = createClient();
    try {
      if (mod === "kayit") {
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.sifre,
          options: { data: { full_name: form.ad.trim() } },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.sifre,
        });
        if (error) throw error;
      }
      // Tam sayfa yönlendirme: yeni oturum çerezi sunucuya garanti gönderilsin
      window.location.assign("/panel");
    } catch (err) {
      setHata(cevirHata(err));
      setYukleniyor(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Sol: marka paneli */}
      <div className="bg-aura relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-rose-soft via-primary-soft to-background p-12 lg:flex">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-elegant">
            <Cloud className="h-5 w-5" />
          </span>
          <span className="font-display text-xl font-semibold">WeddinAI</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-md"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card/60 px-4 py-1.5 text-xs font-medium text-[#9c7740]">
            <Sparkles className="h-3.5 w-3.5" />
            Premium etkinlik anı platformu
          </span>
          <h2 className="font-display mt-6 text-4xl font-semibold leading-tight">
            Özel anlarınız, tek bir buluta aksın.
          </h2>
          <div className="mt-8 rounded-2xl border border-border bg-card/70 p-6 backdrop-blur">
            <Quote className="h-6 w-6 text-primary" />
            <p className="mt-3 text-sm leading-relaxed text-foreground/80">
              &ldquo;Düğünümüzde 480&apos;den fazla fotoğraf toplandı, hepsi
              ertesi sabah elimizdeydi. Misafirlerimiz bayıldı!&rdquo;
            </p>
            <p className="mt-3 text-sm font-medium">— Elif &amp; Mert</p>
          </div>
        </motion.div>

        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} WeddinAI
        </p>
      </div>

      {/* Sağ: form */}
      <div className="flex items-center justify-center px-5 py-12 sm:px-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <Link href="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Cloud className="h-5 w-5" />
            </span>
            <span className="font-display text-xl font-semibold">WeddinAI</span>
          </Link>

          <h1 className="font-display text-2xl font-semibold tracking-tight">
            {mod === "giris" ? "Tekrar hoş geldiniz" : "Hesabınızı oluşturun"}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {mod === "giris"
              ? "Etkinliklerinizi yönetmek için giriş yapın."
              : "İlk etkinliğiniz tamamen ücretsiz. Kredi kartı gerekmez."}
          </p>

          <form onSubmit={gonder} className="mt-7 space-y-4">
            {mod === "kayit" && (
              <Alan
                label="Ad Soyad"
                icon={User}
                value={form.ad}
                onChange={(v) => setForm((f) => ({ ...f, ad: v }))}
                placeholder="Elif Yılmaz"
              />
            )}
            <Alan
              label="E-posta"
              icon={Mail}
              type="email"
              value={form.email}
              onChange={(v) => setForm((f) => ({ ...f, email: v }))}
              placeholder="ornek@eposta.com"
            />
            <div>
              <label className="text-sm font-medium">Şifre</label>
              <div className="relative mt-2">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={sifreGoster ? "text" : "password"}
                  value={form.sifre}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, sifre: e.target.value }))
                  }
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-10 text-sm outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setSifreGoster((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Şifreyi göster"
                >
                  {sifreGoster ? (
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

            {mod === "giris" && (
              <div className="flex justify-end">
                <Link
                  href="#"
                  className="text-xs text-[#9c7740] hover:underline"
                >
                  Şifremi unuttum
                </Link>
              </div>
            )}

            <button
              type="submit"
              disabled={yukleniyor}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground shadow-elegant transition-all hover:brightness-110 disabled:opacity-60"
            >
              {yukleniyor && <Loader2 className="h-4 w-4 animate-spin" />}
              {mod === "giris" ? "Giriş Yap" : "Ücretsiz Hesap Oluştur"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mod === "giris" ? (
              <>
                Hesabınız yok mu?{" "}
                <Link
                  href="/kayit"
                  className="font-medium text-[#9c7740] hover:underline"
                >
                  Kayıt olun
                </Link>
              </>
            ) : (
              <>
                Zaten hesabınız var mı?{" "}
                <Link
                  href="/giris"
                  className="font-medium text-[#9c7740] hover:underline"
                >
                  Giriş yapın
                </Link>
              </>
            )}
          </p>
        </motion.div>
      </div>
    </div>
  );
}

// Supabase Auth hatalarını anlaşılır Türkçe mesaja çevirir
function cevirHata(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  const m = msg.toLowerCase();
  if (m.includes("invalid login credentials"))
    return "E-posta veya şifre hatalı.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "Bu e-posta zaten kayıtlı. Giriş yapmayı deneyin.";
  if (m.includes("email not confirmed"))
    return "E-postanızı henüz onaylamadınız.";
  if (m.includes("password should be"))
    return "Şifreniz en az 6 karakter olmalı.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Çok fazla deneme yaptınız. Lütfen biraz bekleyin.";
  if (m.includes("fetch") || m.includes("network"))
    return "Bağlantı hatası. İnternetinizi kontrol edin.";
  return "Bir şeyler ters gitti. Lütfen tekrar deneyin.";
}

function Alan({
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  icon: typeof Mail;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <div className="relative mt-2">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm outline-none focus:border-primary"
        />
      </div>
    </div>
  );
}
