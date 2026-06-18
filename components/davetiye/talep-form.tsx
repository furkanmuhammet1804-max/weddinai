"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Heart,
  Loader2,
  CheckCircle2,
  Upload,
  X,
  Music,
  CalendarHeart,
  Users,
  Plus,
  Trash2,
  PenLine,
  Flame,
  Gem,
  Sparkles,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Etkinlik } from "@/lib/davetiye";

const MAKS_FOTO = 12;
const MAKS_BAYT = 25 * 1024 * 1024; // 25 MB
const MUZIK_TUR = [".mp3", ".wav", ".m4a"];
const TUR_SECENEKLERI = ["Nişan", "Kına Gecesi", "Düğün Töreni", "Nikah", "Diğer"];

// Her etkinlik türünün kendine ait zarif simgesi — Kına ile Düğün
// görsel olarak net ayrışsın diye.
const ETK_IKON: Record<string, React.ReactNode> = {
  Nişan: <Gem className="h-4 w-4" />,
  "Kına Gecesi": <Flame className="h-4 w-4" />,
  "Düğün Töreni": <Heart className="h-4 w-4" />,
  Nikah: <Sparkles className="h-4 w-4" />,
  Diğer: <CalendarHeart className="h-4 w-4" />,
};

type Form = Record<string, string>;

function uzanti(f: File): string {
  const p = f.name.lastIndexOf(".");
  return p >= 0 ? f.name.slice(p + 1).toLowerCase() : "dat";
}

export function DavetiyeTalepForm() {
  const supabase = useRef(createClient());
  const [form, setForm] = useState<Form>({});
  const [etkinlikler, setEtkinlikler] = useState<Etkinlik[]>([
    { tur: "Düğün Töreni" },
  ]);
  const [gelinFoto, setGelinFoto] = useState<File | null>(null);
  const [damatFoto, setDamatFoto] = useState<File | null>(null);
  const [galeri, setGaleri] = useState<File[]>([]);
  const [muzik, setMuzik] = useState<File | null>(null);
  const [durum, setDurum] = useState<"form" | "gonderiliyor" | "tamam">("form");
  const [asama, setAsama] = useState("");
  const [hata, setHata] = useState<string | null>(null);

  const set = (k: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Etkinlik listesi yardımcıları
  const setEtk = (i: number, k: keyof Etkinlik, v: string) =>
    setEtkinlikler((es) => es.map((e, j) => (j === i ? { ...e, [k]: v } : e)));
  const etkEkle = () =>
    setEtkinlikler((es) => [...es, { tur: "Kına Gecesi" }]);
  const etkSil = (i: number) =>
    setEtkinlikler((es) => es.filter((_, j) => j !== i));

  function galeriEkle(list: FileList | null) {
    if (!list) return;
    const yeni = Array.from(list).filter((f) => f.size <= MAKS_BAYT);
    setGaleri((g) => [...g, ...yeni].slice(0, MAKS_FOTO));
  }

  async function yukle(id: string, file: File, etiket: string): Promise<string> {
    const path = `${id}/${etiket}-${crypto.randomUUID()}.${uzanti(file)}`;
    const { error } = await supabase.current.storage
      .from("davetiye-media")
      .upload(path, file, { upsert: false });
    if (error) throw error;
    return path;
  }

  async function gonder(e: React.FormEvent) {
    e.preventDefault();
    if (durum === "gonderiliyor") return;
    setHata(null);

    if (!form.gelin_ad?.trim() || !form.damat_ad?.trim()) {
      setHata("Lütfen gelin ve damat adını girin.");
      return;
    }
    if (!form.phone?.trim() && !form.email?.trim()) {
      setHata("Size ulaşabilmemiz için telefon veya e-posta gerekli.");
      return;
    }
    const dolu = etkinlikler.filter((x) => x.tur?.trim());
    if (dolu.length === 0) {
      setHata("En az bir etkinlik ekleyin (ör. Düğün Töreni).");
      return;
    }
    if (muzik && !MUZIK_TUR.some((t) => muzik.name.toLowerCase().endsWith(t))) {
      setHata("Müzik formatı MP3, WAV veya M4A olmalı.");
      return;
    }

    setDurum("gonderiliyor");
    try {
      setAsama("Talep oluşturuluyor…");
      const res = await fetch("/api/davetiye/talep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, etkinlikler: dolu }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.hata ?? "Talep kaydedilemedi.");
      const id: string = data.id;

      const medya: Record<string, unknown> = {};
      const toplam =
        (gelinFoto ? 1 : 0) +
        (damatFoto ? 1 : 0) +
        galeri.length +
        (muzik ? 1 : 0);
      let n = 0;
      const ilerlet = () => setAsama(`Materyaller yükleniyor… ${++n}/${toplam}`);

      if (gelinFoto) { ilerlet(); medya.gelin_foto = await yukle(id, gelinFoto, "gelin"); }
      if (damatFoto) { ilerlet(); medya.damat_foto = await yukle(id, damatFoto, "damat"); }
      if (galeri.length) {
        const paths: string[] = [];
        for (const f of galeri) { ilerlet(); paths.push(await yukle(id, f, "galeri")); }
        medya.foto_paths = paths;
      }
      if (muzik) { ilerlet(); medya.muzik_path = await yukle(id, muzik, "muzik"); }

      if (Object.keys(medya).length) {
        setAsama("Tamamlanıyor…");
        await fetch("/api/davetiye/medya", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, ...medya }),
        });
      }
      setDurum("tamam");
    } catch (err) {
      setHata(err instanceof Error ? err.message : "Bir hata oluştu. Tekrar deneyin.");
      setDurum("form");
    }
  }

  if (durum === "tamam") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-luxe mx-auto max-w-lg rounded-[1.75rem] p-8 text-center sm:p-12"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-primary">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary-deep/70">
          Talebiniz alındı
        </p>
        <h2 className="font-display mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          Teşekkür ederiz 💛
        </h2>
        <p className="mx-auto mt-3 max-w-sm text-[15px] leading-relaxed text-muted-foreground">
          Ekibimiz en kısa sürede sizinle iletişime geçip ödeme ve tasarım
          sürecini başlatacak. Davetiyeniz onaylandığında size özel bağlantınız
          paylaşılacaktır.
        </p>
        <Link
          href="/"
          className="btn-luxe mt-8 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-primary-foreground"
        >
          Ana sayfaya dön
        </Link>
      </motion.div>
    );
  }

  return (
    <form onSubmit={gonder} className="mx-auto w-full max-w-2xl space-y-6 sm:space-y-8">
      {/* 01 — İsimler: gelin & damat yan yana, eşit genişlik, kusursuz hizalı */}
      <Bolum
        no="01"
        baslik="Çiftin İsimleri"
        ikon={<Heart className="h-[1.05rem] w-[1.05rem]" />}
        aciklama="Davetiyenizin kalbinde yer alacak iki isim."
      >
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <IsimAlan
            label="Gelin"
            value={form.gelin_ad ?? ""}
            onChange={set("gelin_ad")}
          />
          <IsimAlan
            label="Damat"
            value={form.damat_ad ?? ""}
            onChange={set("damat_ad")}
          />
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Alan label="Telefon">
            <input type="tel" className={inp} value={form.phone ?? ""} onChange={set("phone")} placeholder="05xx xxx xx xx" />
          </Alan>
          <Alan label="E-posta">
            <input type="email" className={inp} value={form.email ?? ""} onChange={set("email")} placeholder="ornek@eposta.com" />
          </Alan>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Size ulaşabilmemiz için telefon <span className="text-primary-deep">veya</span> e-posta yeterlidir.
        </p>
      </Bolum>

      {/* 02 — Etkinlikler: her organizasyon kendi zarif kartında, türüne göre simge */}
      <Bolum
        no="02"
        baslik="Etkinlikler"
        ikon={<CalendarHeart className="h-[1.05rem] w-[1.05rem]" />}
        aciklama="Kına, nişan, düğün, nikah… Her organizasyon ayrı bir kartta, kendi simgesiyle görünür."
        aksiyon={
          <button
            type="button"
            onClick={etkEkle}
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 px-3.5 py-2 text-xs font-semibold text-primary-deep transition-colors hover:bg-primary-soft/50"
          >
            <Plus className="h-3.5 w-3.5" /> Etkinlik Ekle
          </button>
        }
      >
        <div className="space-y-4">
          {etkinlikler.map((e, i) => (
            <div key={i} className="rounded-2xl border border-border bg-background/40 p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft/70 text-primary-deep">
                    {ETK_IKON[e.tur ?? ""] ?? <CalendarHeart className="h-4 w-4" />}
                  </span>
                  <div className="leading-tight">
                    <span className="font-display text-base font-semibold">
                      {e.tur?.trim() || `Etkinlik ${i + 1}`}
                    </span>
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
                      Etkinlik {i + 1}
                    </span>
                  </div>
                </div>
                {etkinlikler.length > 1 && (
                  <button
                    type="button"
                    onClick={() => etkSil(i)}
                    aria-label="Etkinliği kaldır"
                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-rose-soft hover:text-rose"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="grid gap-3.5 sm:grid-cols-2">
                <Alan label="Etkinlik Türü">
                  <Sec value={e.tur} onChange={(ev) => setEtk(i, "tur", ev.target.value)}>
                    {TUR_SECENEKLERI.map((t) => <option key={t} value={t}>{t}</option>)}
                  </Sec>
                </Alan>
                <Alan label="Mekan Adı">
                  <input className={inp} value={e.mekan ?? ""} onChange={(ev) => setEtk(i, "mekan", ev.target.value)} placeholder="Örn. Sapphire Davet" />
                </Alan>
                <Alan label="Tarih">
                  <input type="date" className={inp} value={e.tarih ?? ""} onChange={(ev) => setEtk(i, "tarih", ev.target.value)} />
                </Alan>
                <Alan label="Saat">
                  <input type="time" className={inp} value={e.saat ?? ""} onChange={(ev) => setEtk(i, "saat", ev.target.value)} />
                </Alan>
                <Alan label="Açık Adres" genis>
                  <input className={inp} value={e.adres ?? ""} onChange={(ev) => setEtk(i, "adres", ev.target.value)} placeholder="Mahalle, cadde, no…" />
                </Alan>
                <Alan label="Google Maps Linki" opsiyonel genis>
                  <input className={inp} value={e.maps ?? ""} onChange={(ev) => setEtk(i, "maps", ev.target.value)} placeholder="https://maps.app.goo.gl/…" />
                </Alan>
              </div>
            </div>
          ))}
        </div>
      </Bolum>

      {/* 03 — Fotoğraflar */}
      <Bolum
        no="03"
        baslik="Fotoğraflar"
        ikon={<Upload className="h-[1.05rem] w-[1.05rem]" />}
        aciklama="Gelin ve damat portreleri ile dilerseniz bir anı galerisi."
      >
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <TekFoto label="Gelin Fotoğrafı" file={gelinFoto} onSec={setGelinFoto} />
          <TekFoto label="Damat Fotoğrafı" file={damatFoto} onSec={setDamatFoto} />
        </div>
        <div className="mt-5">
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Galeri <span className="font-normal normal-case tracking-normal text-muted-foreground/70">— en fazla {MAKS_FOTO}, opsiyonel</span>
          </label>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-background/40 px-4 py-8 text-center text-sm text-muted-foreground transition-colors hover:border-primary hover:bg-primary-soft/20">
            <Upload className="h-5 w-5" />
            <span>Fotoğraf eklemek için dokunun</span>
            <span className="text-xs text-muted-foreground/70">JPG, PNG · her biri en fazla 25 MB</span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => galeriEkle(e.target.files)} />
          </label>
          {galeri.length > 0 && (
            <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
              {galeri.map((f, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-xl border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={URL.createObjectURL(f)} alt="" className="h-full w-full object-cover" />
                  <button type="button" onClick={() => setGaleri((g) => g.filter((_, j) => j !== i))} className="absolute right-1 top-1 rounded-full bg-black/55 p-1 text-white backdrop-blur-sm">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Bolum>

      {/* 04 — Aile Bilgileri */}
      <Bolum
        no="04"
        baslik="Aile Bilgileri"
        ikon={<Users className="h-[1.05rem] w-[1.05rem]" />}
        aciklama="Davetiyede yer almasını istediğiniz aile takdimleri (opsiyonel)."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Alan label="Gelin Tarafı" genis>
            <textarea className={`${inp} min-h-24 resize-y`} value={form.gelin_aile ?? ""} onChange={set("gelin_aile")} placeholder="Örn. … ailesi" />
          </Alan>
          <Alan label="Damat Tarafı" genis>
            <textarea className={`${inp} min-h-24 resize-y`} value={form.damat_aile ?? ""} onChange={set("damat_aile")} placeholder="Örn. … ailesi" />
          </Alan>
        </div>
      </Bolum>

      {/* 05 — Davetiye Müziği */}
      <Bolum
        no="05"
        baslik="Davetiye Müziği"
        ikon={<Music className="h-[1.05rem] w-[1.05rem]" />}
      >
        <div className="rounded-2xl border border-primary/20 bg-primary-soft/30 p-4 sm:p-5">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm leading-relaxed text-foreground/80">
            <span className="inline-flex items-center rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary-foreground">
              Önerilen
            </span>
            <span className="flex-1 min-w-[14rem]">
              YouTube bağlantısı paylaşmanız yeterlidir; teknik işlemleri biz hallederiz.
            </span>
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Dilerseniz MP3 / WAV / M4A dosyası da yükleyebilirsiniz. Müzik, ziyaretçi “🎵 Müziği Başlat” butonuna bastığında çalar.
          </p>
        </div>
        <div className="mt-4 grid gap-4">
          <Alan label="YouTube Müzik Linki" genis>
            <input className={inp} value={form.muzik_youtube ?? ""} onChange={set("muzik_youtube")} placeholder="https://youtube.com/…" />
          </Alan>
          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              veya Ses Dosyası <span className="font-normal normal-case tracking-normal text-muted-foreground/70">— MP3 / WAV / M4A</span>
            </label>
            <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border bg-background/40 px-4 py-3.5 text-sm text-muted-foreground transition-colors hover:border-primary">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-primary-deep">
                <Music className="h-4 w-4" />
              </span>
              <span className="truncate">{muzik ? muzik.name : "Dosya seçin"}</span>
              <input type="file" accept=".mp3,.wav,.m4a,audio/*" className="hidden" onChange={(e) => setMuzik(e.target.files?.[0] ?? null)} />
            </label>
          </div>
        </div>
      </Bolum>

      {/* 06 — Ek Notlar */}
      <Bolum
        no="06"
        baslik="Ek Notlar"
        ikon={<PenLine className="h-[1.05rem] w-[1.05rem]" />}
        aciklama="Tasarım, renk tercihi, davetiye mesajı… aklınızdaki her şey."
      >
        <Alan label="Özel istekleriniz" genis>
          <textarea className={`${inp} min-h-28 resize-y`} value={form.notlar ?? ""} onChange={set("notlar")} placeholder="Eklemek istedikleriniz…" />
        </Alan>
      </Bolum>

      {hata && (
        <p className="rounded-2xl bg-rose-soft px-4 py-3.5 text-sm font-medium text-rose">{hata}</p>
      )}

      <div className="pt-1">
        <button
          type="submit"
          disabled={durum === "gonderiliyor"}
          className="btn-luxe inline-flex w-full items-center justify-center gap-2.5 rounded-full py-4 text-[15px] font-semibold text-primary-foreground transition-all disabled:opacity-60"
        >
          {durum === "gonderiliyor" ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> {asama || "Gönderiliyor…"}</>
          ) : (
            <>Davetiye Talebimi Oluştur <ArrowRight className="h-[1.05rem] w-[1.05rem]" /></>
          )}
        </button>
        <p className="mt-3 text-center text-xs leading-relaxed text-muted-foreground">
          Talebiniz sonrası ekibimiz ödeme ve tasarım için sizinle iletişime geçer.
          <br className="hidden sm:block" /> Hiçbir ön ödeme alınmaz.
        </p>
      </div>
    </form>
  );
}

const inp =
  "w-full rounded-2xl border border-border bg-background/50 px-4 py-3.5 text-[15px] text-foreground outline-none transition-all placeholder:text-muted-foreground/50 focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/10";

function Bolum({
  no,
  baslik,
  ikon,
  aciklama,
  aksiyon,
  children,
}: {
  no: string;
  baslik: string;
  ikon: React.ReactNode;
  aciklama?: string;
  aksiyon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.4 }}
      className="card-luxe rounded-[1.75rem] p-6 sm:p-8"
    >
      <header className="mb-6 sm:mb-7">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-muted text-primary-deep">
              {ikon}
            </span>
            <div className="leading-none">
              <span className="bolum-no block text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60">
                Adım {no}
              </span>
              <h2 className="font-display mt-1.5 text-xl font-semibold tracking-tight sm:text-[1.6rem]">
                {baslik}
              </h2>
            </div>
          </div>
          {aksiyon && <div className="shrink-0">{aksiyon}</div>}
        </div>
        {aciklama && (
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{aciklama}</p>
        )}
        <div className="divider-gold mt-5" />
      </header>
      {children}
    </motion.section>
  );
}

function Alan({
  label,
  children,
  zorunlu,
  opsiyonel,
  genis,
}: {
  label: string;
  children: React.ReactNode;
  zorunlu?: boolean;
  opsiyonel?: boolean;
  genis?: boolean;
}) {
  return (
    <div className={genis ? "sm:col-span-2" : ""}>
      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
        {zorunlu && <span className="ml-1 text-primary">*</span>}
        {opsiyonel && (
          <span className="ml-1.5 font-normal normal-case tracking-normal text-muted-foreground/60">opsiyonel</span>
        )}
      </label>
      {children}
    </div>
  );
}

// Gelin & Damat — ortalı, eşit genişlikte, aynı yükseklikte zarif isim alanı.
function IsimAlan({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="flex flex-col">
      <label className="mb-2 text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-primary-deep/80">
        {label} <span className="text-primary">*</span>
      </label>
      <input
        className={`${inp} text-center font-medium`}
        value={value}
        onChange={onChange}
        placeholder="Adı Soyadı"
      />
    </div>
  );
}

function Sec({
  value,
  onChange,
  children,
}: {
  value?: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select className={`${inp} appearance-none pr-10`} value={value} onChange={onChange}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

function TekFoto({ label, file, onSec }: { label: string; file: File | null; onSec: (f: File | null) => void }) {
  return (
    <div>
      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label} <span className="font-normal normal-case tracking-normal text-muted-foreground/60">opsiyonel</span>
      </label>
      <label className="flex h-full cursor-pointer items-center gap-3 rounded-2xl border border-border bg-background/40 px-3.5 py-3.5 text-sm transition-colors hover:border-primary">
        {file ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={URL.createObjectURL(file)} alt="" className="h-11 w-11 shrink-0 rounded-xl object-cover" />
        ) : (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <Upload className="h-4 w-4" />
          </span>
        )}
        <span className="truncate text-muted-foreground">{file ? file.name : "Fotoğraf seçin"}</span>
        <input type="file" accept="image/*" className="hidden" onChange={(e) => onSec(e.target.files?.[0] ?? null)} />
      </label>
    </div>
  );
}
