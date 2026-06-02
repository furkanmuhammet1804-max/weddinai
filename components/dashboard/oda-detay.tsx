"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import {
  ArrowLeft,
  Copy,
  Check,
  Lock,
  QrCode,
  ExternalLink,
  Download,
  Users,
  Images,
  PenLine,
  Loader2,
  Eye,
  EyeOff,
  Store,
  MonitorPlay,
} from "lucide-react";
import { turEtiket, tarihTR } from "@/lib/etkinlik";

interface Oda {
  id: string;
  title: string;
  customer_name: string | null;
  event_type: string;
  event_date: string | null;
  slug: string;
  status: string;
}

export function OdaDetay({
  oda,
  medyaSayi,
  aniSayi,
}: {
  oda: Oda;
  medyaSayi: number;
  aniSayi: number;
}) {
  const [origin, setOrigin] = useState("");
  const [qr, setQr] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const musteriLink = origin ? `${origin}/oda/${oda.slug}` : "";
  const misafirLink = origin ? `${origin}/e/${oda.slug}` : "";
  const showroomLink = origin ? `${origin}/showroom/${oda.slug}` : "";
  const slaytLink = origin ? `${origin}/slayt/${oda.slug}` : "";

  useEffect(() => {
    if (!misafirLink) return;
    QRCode.toDataURL(misafirLink, { width: 520, margin: 2 })
      .then(setQr)
      .catch(() => setQr(""));
  }, [misafirLink]);

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/panel"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Odalar
      </Link>

      {/* Başlık */}
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-deep">
            {turEtiket(oda.event_type)}
            {oda.event_date ? ` · ${tarihTR(oda.event_date)}` : ""}
          </p>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            {oda.title}
          </h1>
          {oda.customer_name && (
            <p className="text-sm text-muted-foreground">{oda.customer_name}</p>
          )}
        </div>
      </div>

      {/* İstatistik */}
      <div className="mt-5 grid grid-cols-3 gap-3">
        <Mini icon={Images} deger={medyaSayi} etiket="Medya" />
        <Mini icon={PenLine} deger={aniSayi} etiket="Anı Notu" />
        <Mini
          icon={Users}
          deger={oda.status === "aktif" ? "Açık" : "Kapalı"}
          etiket="Durum"
        />
      </div>

      {/* Müşteri linki */}
      <Bolum
        baslik="Müşteri Girişi"
        aciklama="Bu linki ve oda şifresini müşterinle paylaş. Müşteri sadece kendi odasını görür."
        icon={Lock}
      >
        <LinkSatiri link={musteriLink} />
        <div className="mt-3 flex flex-wrap gap-2">
          <Ac link={musteriLink} etiket="Müşteri panelini aç" />
        </div>
      </Bolum>

      {/* Misafir QR */}
      <Bolum
        baslik="Misafir QR"
        aciklama="Masalara koyacağın QR. Misafir okuttuğunda doğrudan bu odaya gelir ve yükleme yapar (giriş gerekmez)."
        icon={QrCode}
      >
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="rounded-2xl border border-border bg-white p-3">
            {qr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qr} alt="Misafir QR kodu" className="h-44 w-44" />
            ) : (
              <div className="flex h-44 w-44 items-center justify-center text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )}
          </div>
          <div className="w-full flex-1">
            <LinkSatiri link={misafirLink} />
            <div className="mt-3 flex flex-wrap gap-2">
              {qr && (
                <a
                  href={qr}
                  download={`misafir-qr-${oda.slug}.png`}
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:border-primary hover:text-primary"
                >
                  <Download className="h-4 w-4" /> QR indir
                </a>
              )}
              <Ac link={misafirLink} etiket="Misafir sayfasını aç" />
            </div>
          </div>
        </div>
      </Bolum>

      {/* Showroom */}
      <Bolum
        baslik="Showroom (Vitrin)"
        aciklama="Müşterinin onayladığı fotoğraflar bu herkese açık vitrinde görünür."
        icon={Store}
      >
        <LinkSatiri link={showroomLink} />
        <div className="mt-3">
          <Ac link={showroomLink} etiket="Vitrini aç" />
        </div>
      </Bolum>

      {/* Canlı Slayt */}
      <Bolum
        baslik="Canlı Slayt (Düğün Ekranı)"
        aciklama="Salondaki ekrana/projeksiyona bu linki aç. Misafirler yükledikçe fotoğraflar canlı akar."
        icon={MonitorPlay}
      >
        <LinkSatiri link={slaytLink} />
        <div className="mt-3">
          <Ac link={slaytLink} etiket="Slaytı başlat" />
        </div>
      </Bolum>

      {/* Şifre */}
      <SifreBolum odaId={oda.id} />
    </div>
  );
}

function Mini({
  icon: Icon,
  deger,
  etiket,
}: {
  icon: typeof Images;
  deger: number | string;
  etiket: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-sm">
      <Icon className="mx-auto h-5 w-5 text-primary" />
      <p className="font-display mt-2 text-xl font-semibold">{deger}</p>
      <p className="text-xs text-muted-foreground">{etiket}</p>
    </div>
  );
}

function Bolum({
  baslik,
  aciklama,
  icon: Icon,
  children,
}: {
  baslik: string;
  aciklama: string;
  icon: typeof Lock;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-5 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-deep">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-display font-semibold">{baslik}</h2>
          <p className="text-sm text-muted-foreground">{aciklama}</p>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function LinkSatiri({ link }: { link: string }) {
  const [kopya, setKopya] = useState(false);

  async function kopyala() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setKopya(true);
      setTimeout(() => setKopya(false), 1800);
    } catch {
      /* sessiz */
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5">
      <span className="min-w-0 flex-1 truncate text-sm text-foreground/80">
        {link || "…"}
      </span>
      <button
        type="button"
        onClick={kopyala}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:brightness-110"
      >
        {kopya ? (
          <>
            <Check className="h-3.5 w-3.5" /> Kopyalandı
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" /> Kopyala
          </>
        )}
      </button>
    </div>
  );
}

function Ac({ link, etiket }: { link: string; etiket: string }) {
  return (
    <a
      href={link || "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:border-primary hover:text-primary"
    >
      <ExternalLink className="h-4 w-4" /> {etiket}
    </a>
  );
}

function SifreBolum({ odaId }: { odaId: string }) {
  const [sifre, setSifre] = useState("");
  const [goster, setGoster] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [sonuc, setSonuc] = useState<"ok" | "hata" | null>(null);
  const [mesaj, setMesaj] = useState<string | null>(null);

  async function guncelle() {
    if (yukleniyor) return;
    setSonuc(null);
    setMesaj(null);
    if (sifre.length < 4) {
      setSonuc("hata");
      setMesaj("Şifre en az 4 karakter olmalı.");
      return;
    }
    setYukleniyor(true);
    try {
      const res = await fetch("/api/panel/oda/sifre", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: odaId, sifre }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSonuc("hata");
        setMesaj(data.hata ?? "Güncellenemedi.");
      } else {
        setSonuc("ok");
        setMesaj("Oda şifresi güncellendi.");
        setSifre("");
      }
    } catch {
      setSonuc("hata");
      setMesaj("Bağlantı hatası.");
    } finally {
      setYukleniyor(false);
    }
  }

  return (
    <Bolum
      baslik="Oda Şifresi"
      aciklama="Müşterinin giriş şifresini buradan değiştirebilirsin."
      icon={Lock}
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type={goster ? "text" : "password"}
            value={sifre}
            onChange={(e) => setSifre(e.target.value)}
            placeholder="Yeni oda şifresi"
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
        <button
          type="button"
          onClick={guncelle}
          disabled={yukleniyor}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-elegant hover:brightness-110 disabled:opacity-60"
        >
          {yukleniyor && <Loader2 className="h-4 w-4 animate-spin" />}
          Güncelle
        </button>
      </div>
      {mesaj && (
        <p
          className={`mt-2 text-xs font-medium ${
            sonuc === "ok" ? "text-emerald-600" : "text-rose"
          }`}
        >
          {mesaj}
        </p>
      )}
    </Bolum>
  );
}
