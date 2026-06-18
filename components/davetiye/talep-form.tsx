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
  MapPin,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const MAKS_FOTO = 12;
const MAKS_BAYT = 25 * 1024 * 1024; // 25 MB
const MUZIK_TUR = [".mp3", ".wav", ".m4a"];

type Form = Record<string, string>;

function uzanti(f: File): string {
  const p = f.name.lastIndexOf(".");
  return p >= 0 ? f.name.slice(p + 1).toLowerCase() : "dat";
}

export function DavetiyeTalepForm() {
  const supabase = useRef(createClient());
  const [form, setForm] = useState<Form>({});
  const [gelinFoto, setGelinFoto] = useState<File | null>(null);
  const [damatFoto, setDamatFoto] = useState<File | null>(null);
  const [galeri, setGaleri] = useState<File[]>([]);
  const [muzik, setMuzik] = useState<File | null>(null);
  const [durum, setDurum] = useState<"form" | "gonderiliyor" | "tamam">("form");
  const [asama, setAsama] = useState("");
  const [hata, setHata] = useState<string | null>(null);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

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
      setHata("Telefon veya e-posta gerekli.");
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
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.hata ?? "Talep kaydedilemedi.");
      const id: string = data.id;

      const medya: Record<string, unknown> = {};
      const toplam = (gelinFoto ? 1 : 0) + (damatFoto ? 1 : 0) + galeri.length + (muzik ? 1 : 0);
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
        className="mx-auto max-w-lg rounded-3xl border border-border bg-card p-10 text-center shadow-elegant"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-primary">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <h2 className="font-display mt-5 text-2xl font-semibold">Talebiniz alındı 💛</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Ekibimiz en kısa sürede sizinle iletişime geçip ödeme ve tasarım
          sürecini başlatacak. Davetiyeniz onaylandığında size özel bağlantınız
          paylaşılacaktır.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:brightness-110"
        >
          Ana sayfaya dön
        </Link>
      </motion.div>
    );
  }

  return (
    <form onSubmit={gonder} className="mx-auto max-w-2xl space-y-8">
      <Bolum baslik="Çift Bilgileri" ikon={<Heart className="h-4 w-4" />}>
        <Alan label="Gelin Adı Soyadı" zorunlu><input className={inp} value={form.gelin_ad ?? ""} onChange={set("gelin_ad")} /></Alan>
        <Alan label="Damat Adı Soyadı" zorunlu><input className={inp} value={form.damat_ad ?? ""} onChange={set("damat_ad")} /></Alan>
        <Alan label="Telefon"><input type="tel" className={inp} value={form.phone ?? ""} onChange={set("phone")} placeholder="05xx xxx xx xx" /></Alan>
        <Alan label="E-posta"><input type="email" className={inp} value={form.email ?? ""} onChange={set("email")} /></Alan>
      </Bolum>

      <Bolum baslik="Kına Bilgileri" ikon={<Sparkles className="h-4 w-4" />}>
        <Alan label="Kına Tarihi"><input type="date" className={inp} value={form.kina_tarih ?? ""} onChange={set("kina_tarih")} /></Alan>
        <Alan label="Kına Saati"><input type="time" className={inp} value={form.kina_saat ?? ""} onChange={set("kina_saat")} /></Alan>
        <Alan label="Kına Mekanı"><input className={inp} value={form.kina_mekan ?? ""} onChange={set("kina_mekan")} /></Alan>
        <Alan label="Kına Adresi" genis><input className={inp} value={form.kina_adres ?? ""} onChange={set("kina_adres")} /></Alan>
        <Alan label="Google Maps Linki" genis><input className={inp} value={form.kina_maps ?? ""} onChange={set("kina_maps")} placeholder="https://maps.app.goo.gl/…" /></Alan>
      </Bolum>

      <Bolum baslik="Düğün Bilgileri" ikon={<MapPin className="h-4 w-4" />}>
        <Alan label="Düğün Tarihi"><input type="date" className={inp} value={form.dugun_tarih ?? ""} onChange={set("dugun_tarih")} /></Alan>
        <Alan label="Düğün Saati"><input type="time" className={inp} value={form.dugun_saat ?? ""} onChange={set("dugun_saat")} /></Alan>
        <Alan label="Düğün Mekanı"><input className={inp} value={form.dugun_mekan ?? ""} onChange={set("dugun_mekan")} /></Alan>
        <Alan label="Düğün Adresi" genis><input className={inp} value={form.dugun_adres ?? ""} onChange={set("dugun_adres")} /></Alan>
        <Alan label="Google Maps Linki" genis><input className={inp} value={form.dugun_maps ?? ""} onChange={set("dugun_maps")} placeholder="https://maps.app.goo.gl/…" /></Alan>
      </Bolum>

      <Bolum baslik="Davetiye İçeriği" ikon={<PenIcon />}>
        <Alan label="Davetiye Mesajı" genis>
          <textarea className={`${inp} min-h-24 resize-y`} value={form.mesaj ?? ""} onChange={set("mesaj")} placeholder="Bu özel günümüzde aramızda olmanızı dileriz…" />
        </Alan>
        <Alan label="Özel Notlar" genis>
          <textarea className={`${inp} min-h-20 resize-y`} value={form.notlar ?? ""} onChange={set("notlar")} placeholder="Tasarımla ilgili istekleriniz, renk tercihleri…" />
        </Alan>
      </Bolum>

      <Bolum baslik="Fotoğraflar" ikon={<Upload className="h-4 w-4" />}>
        <div className="grid gap-4 sm:grid-cols-2">
          <TekFoto label="Gelin Fotoğrafı" file={gelinFoto} onSec={setGelinFoto} />
          <TekFoto label="Damat Fotoğrafı" file={damatFoto} onSec={setDamatFoto} />
        </div>
        <div className="mt-2">
          <p className="mb-2 text-sm font-medium">Galeri (en fazla {MAKS_FOTO})</p>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 px-4 py-6 text-sm text-muted-foreground hover:border-primary">
            <Upload className="h-4 w-4" /> Fotoğraf ekle
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => galeriEkle(e.target.files)} />
          </label>
          {galeri.length > 0 && (
            <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
              {galeri.map((f, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-lg border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={URL.createObjectURL(f)} alt="" className="h-full w-full object-cover" />
                  <button type="button" onClick={() => setGaleri((g) => g.filter((_, j) => j !== i))} className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Bolum>

      <Bolum baslik="🎵 Davetiye Müziği" ikon={<Music className="h-4 w-4" />}>
        <p className="-mt-1 mb-1 text-sm text-muted-foreground">
          YouTube bağlantısı paylaşmanız yeterlidir; teknik işlemler tarafımızdan
          yapılır. Dilerseniz MP3/WAV/M4A dosyası da yükleyebilirsiniz. Müzik,
          ziyaretçi “Müziği Başlat” butonuna bastığında çalar.
        </p>
        <Alan label="YouTube Linki" genis><input className={inp} value={form.muzik_youtube ?? ""} onChange={set("muzik_youtube")} placeholder="https://youtu.be/…" /></Alan>
        <Alan label="veya MP3 / WAV / M4A Dosyası" genis>
          <input type="file" accept=".mp3,.wav,.m4a,audio/*" className="block w-full text-sm" onChange={(e) => setMuzik(e.target.files?.[0] ?? null)} />
          {muzik && <p className="mt-1 text-xs text-muted-foreground">{muzik.name}</p>}
        </Alan>
      </Bolum>

      {hata && (
        <p className="rounded-xl bg-rose-soft px-4 py-3 text-sm font-medium text-rose">{hata}</p>
      )}

      <button
        type="submit"
        disabled={durum === "gonderiliyor"}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-elegant transition-all hover:brightness-110 disabled:opacity-60"
      >
        {durum === "gonderiliyor" ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> {asama || "Gönderiliyor…"}</>
        ) : (
          <><Heart className="h-4 w-4" /> Davetiye Talebi Oluştur</>
        )}
      </button>
      <p className="text-center text-xs text-muted-foreground">
        Talebiniz sonrası ekibimiz ödeme ve tasarım için sizinle iletişime geçer.
      </p>
    </form>
  );
}

const inp =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary";

function PenIcon() {
  return <Sparkles className="h-4 w-4" />;
}

function Bolum({ baslik, ikon, children }: { baslik: string; ikon: React.ReactNode; children: React.ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.4 }}
      className="rounded-3xl border border-border bg-card/70 p-6 shadow-sm backdrop-blur"
    >
      <h2 className="mb-4 inline-flex items-center gap-2 font-display text-lg font-semibold">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-soft text-primary-deep">{ikon}</span>
        {baslik}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </motion.section>
  );
}

function Alan({ label, children, zorunlu, genis }: { label: string; children: React.ReactNode; zorunlu?: boolean; genis?: boolean }) {
  return (
    <div className={genis ? "sm:col-span-2" : ""}>
      <label className="mb-1.5 block text-sm font-medium">
        {label} {zorunlu && <span className="text-rose">*</span>}
      </label>
      {children}
    </div>
  );
}

function TekFoto({ label, file, onSec }: { label: string; file: File | null; onSec: (f: File | null) => void }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium">{label}</p>
      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-background px-3 py-3 text-sm hover:border-primary">
        {file ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={URL.createObjectURL(file)} alt="" className="h-10 w-10 rounded-lg object-cover" />
        ) : (
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground"><Upload className="h-4 w-4" /></span>
        )}
        <span className="truncate text-muted-foreground">{file ? file.name : "Seç"}</span>
        <input type="file" accept="image/*" className="hidden" onChange={(e) => onSec(e.target.files?.[0] ?? null)} />
      </label>
    </div>
  );
}
