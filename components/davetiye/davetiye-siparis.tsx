"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Loader2,
  CheckCircle2,
  Upload,
  X,
  Play,
  ArrowRight,
  ArrowDown,
  Plus,
  Trash2,
  MapPin,
  Music,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Etkinlik } from "@/lib/davetiye";
import {
  DAVETIYE_TEMALAR,
  temaBul,
  type DavetiyeTema,
  type DavetiyeTemaId,
} from "@/lib/davetiye-tema";
import { CiftIsim } from "@/components/davetiye/cift-isim";
import { AiYardimModal } from "@/components/davetiye/ai-yardim-modal";
import { AiOneriModal } from "@/components/ai/ai-oneri-modal";

// Özellik 2 — Davetiye not yardımcısı kategorileri.
const NOT_KATEGORILER = [
  { deger: "hikaye", etiket: "Çift hikâyemiz" },
  { deger: "aciklama", etiket: "Davetiye açıklaması" },
  { deger: "tasarim", etiket: "Tasarım isteği" },
];

// Hazır davet metinleri — doğal, klişeden uzak (müşteri tek tıkla seçer).
const HAZIR_METINLER: string[] = [
  "Birlikte çıktığımız bu yolda, en sevdiklerimizi yanımızda görmek isteriz.",
  "Mutluluğumuza ortak olmanız, bu günü bizim için unutulmaz kılacak.",
  "Kahkahalarımıza ve sevincimize siz de katılın; sizi aramızda görmek isteriz.",
  "Hayatımızın bu güzel başlangıcında, en yakınlarımızla aynı karede olmak isteriz.",
  "Yıllar sonra gülümseyerek anacağımız bu güne sizi de bekliyoruz.",
];

const MAKS_FOTO = 12;
const MAKS_BAYT = 25 * 1024 * 1024; // 25 MB
const MUZIK_TUR = [".mp3", ".wav", ".m4a"];
const EK_TURLER = ["Nişan", "Nikah", "After Party", "Diğer"];

type Metin = Record<string, string>;

function uzanti(f: File): string {
  const p = f.name.lastIndexOf(".");
  return p >= 0 ? f.name.slice(p + 1).toLowerCase() : "dat";
}
function bosMu(e: Etkinlik): boolean {
  return !(e.tarih || e.saat || e.mekan || e.adres || e.maps);
}
function trTarih(t?: string | null): string | null {
  if (!t) return null;
  const d = new Date(`${t}T12:00:00`);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}
function ilkAd(tam?: string): string {
  return (tam ?? "").trim().split(/\s+/)[0] ?? "";
}

export function DavetiyeSiparis() {
  const supabase = useRef(createClient());
  const [form, setForm] = useState<Metin>({});
  const [dugun, setDugun] = useState<Etkinlik>({ tur: "Düğün Töreni" });
  const [kina, setKina] = useState<Etkinlik>({ tur: "Kına Gecesi" });
  const [ekstra, setEkstra] = useState<Etkinlik[]>([]);
  const [gelinFoto, setGelinFoto] = useState<File | null>(null);
  const [damatFoto, setDamatFoto] = useState<File | null>(null);
  const [galeri, setGaleri] = useState<File[]>([]);
  const [muzik, setMuzik] = useState<File | null>(null);
  const [tema, setTema] = useState<DavetiyeTemaId>("ivory");
  const [durum, setDurum] = useState<"form" | "gonderiliyor" | "tamam">("form");
  const [asama, setAsama] = useState("");
  const [hata, setHata] = useState<string | null>(null);
  const [aiAcik, setAiAcik] = useState(false);
  const [notAiAcik, setNotAiAcik] = useState(false);

  // AI önerisini "Özel istekler" notuna aktarır (varsa mevcut metnin altına ekler).
  function notaAktar(metin: string) {
    setForm((f) => {
      const mevcut = (f.notlar ?? "").trim();
      return { ...f, notlar: mevcut ? `${mevcut}\n\n${metin}` : metin };
    });
    setNotAiAcik(false);
  }

  // Seçilen/AI/hazır DAVET METNİNİ form.mesaj'a yazar (davetiyede görünen metin).
  // Replace eder: davet metni tek bir metindir (A/B/C akışlarının hepsi buraya yazar).
  function mesajaAktar(metin: string) {
    setForm((f) => ({ ...f, mesaj: metin }));
    setAiAcik(false);
  }

  const set = (k: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setD = (k: keyof Etkinlik, v: string) => setDugun((d) => ({ ...d, [k]: v }));
  const setK = (k: keyof Etkinlik, v: string) => setKina((d) => ({ ...d, [k]: v }));
  const setE = (i: number, k: keyof Etkinlik, v: string) =>
    setEkstra((es) => es.map((e, j) => (j === i ? { ...e, [k]: v } : e)));
  const ekEkle = () => setEkstra((es) => [...es, { tur: "Nişan" }]);
  const ekSil = (i: number) => setEkstra((es) => es.filter((_, j) => j !== i));

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
      setHata("Gelin ve damat isimlerini girelim — davetiyenin kalbi onlar.");
      return;
    }
    if (!form.phone?.trim() && !form.email?.trim()) {
      setHata("Size ulaşabilmemiz için telefon veya e-posta yeterli.");
      return;
    }
    const etkinlikler: Etkinlik[] = [];
    if (!bosMu(kina)) etkinlikler.push({ ...kina, tur: "Kına Gecesi" });
    if (!bosMu(dugun)) etkinlikler.push({ ...dugun, tur: "Düğün Töreni" });
    ekstra.forEach((x) => { if (x.tur?.trim() && !bosMu(x)) etkinlikler.push(x); });
    if (etkinlikler.length === 0) {
      setHata("En az bir törenin tarih veya mekânını ekleyin (ör. Düğün Töreni).");
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
        body: JSON.stringify({ ...form, etkinlikler, tema }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detay = data.sebep ? ` (${data.sebep})` : "";
        throw new Error(`${data.hata ?? "Talep kaydedilemedi."}${detay}`);
      }
      const id: string = data.id;

      const medya: Record<string, unknown> = {};
      const toplam =
        (gelinFoto ? 1 : 0) + (damatFoto ? 1 : 0) + galeri.length + (muzik ? 1 : 0);
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

  // ---- Canlı önizleme değerleri ----
  const onGelin = ilkAd(form.gelin_ad) || "Bengisu";
  const onDamat = ilkAd(form.damat_ad) || "Furkan";
  const onTarih = trTarih(dugun.tarih) ?? trTarih(kina.tarih) ?? "Yakında";
  const aktifTema = temaBul(tema);

  if (durum === "tamam") {
    return <Bitis gelin={onGelin} damat={onDamat} />;
  }

  return (
    <div className="tema-fildisi">
      {/* ============================ HERO ============================ */}
      <section className="bg-aura relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-16 pt-12 sm:px-8 sm:pb-24 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
          {/* Metin */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-center lg:text-left"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-primary-deep/70">
              WeddinAI · Dijital Davetiye Atölyesi
            </p>
            <h1 className="font-display mt-6 text-[2.6rem] leading-[1.04] tracking-tight sm:text-6xl lg:text-[4.2rem]">
              Davetiyeniz
              <br />
              <span className="italic text-gradient-gold">bir esere</span> dönüşsün
            </h1>
            <p className="mx-auto mt-6 max-w-md text-[15px] leading-relaxed text-muted-foreground sm:text-base lg:mx-0">
              İsimlerinizi yazın, törenlerinizi anlatın; gerisini tasarım
              ekibimiz el işçiliğiyle hazırlasın. Soldaki davetiye siz
              yazdıkça canlanır.
            </p>
            <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <a
                href="#siparis"
                className="btn-luxe inline-flex w-full items-center justify-center gap-2.5 rounded-full px-7 py-4 text-[15px] font-semibold text-primary-foreground sm:w-auto"
              >
                Davetiyemi Hazırla <ArrowRight className="h-[1.05rem] w-[1.05rem]" />
              </a>
              <Link
                href="/showroom"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card/60 px-7 py-4 text-[15px] font-medium text-foreground/80 transition-colors hover:text-foreground sm:w-auto"
              >
                Örnekleri Gör
              </Link>
            </div>
            <div className="mt-10 flex items-center justify-center gap-7 text-sm text-muted-foreground lg:justify-start">
              <Istatistik n="850+" l="hazırlanan davetiye" />
              <span className="h-8 w-px bg-border" />
              <Istatistik n="24 saat" l="ilk taslak" />
              <span className="h-8 w-px bg-border" />
              <Istatistik n="₺0" l="ön ödeme" />
            </div>
          </motion.div>

          {/* Canlı telefon önizlemesi */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 28 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto flex w-full max-w-[300px] justify-center"
          >
            <Telefon gelin={onGelin} damat={onDamat} tarih={onTarih} tema={aktifTema} />
          </motion.div>
        </div>
        <a
          href="#siparis"
          className="mx-auto -mt-2 mb-10 hidden w-fit items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground sm:flex"
        >
          Hazırlamaya başla <ArrowDown className="h-4 w-4 animate-bounce" />
        </a>
      </section>

      {/* ========================= SİPARİŞ ========================= */}
      <form
        id="siparis"
        onSubmit={gonder}
        className="mx-auto w-full max-w-2xl scroll-mt-20 px-6 pb-24 pt-6 sm:px-8 sm:pb-32"
      >
        {/* 01 — İsimler */}
        <Bolum
          no="01"
          kicker="Çift"
          baslik="İki isim, bir hikâye"
          aciklama="Davetiyenizin kalbinde yer alacak isimler ve size nasıl ulaşacağımız."
        >
          <div className="grid grid-cols-2 gap-5 sm:gap-7">
            <IsimAlan label="Gelin" value={form.gelin_ad ?? ""} onChange={set("gelin_ad")} />
            <IsimAlan label="Damat" value={form.damat_ad ?? ""} onChange={set("damat_ad")} />
          </div>
          <div className="mt-9 grid gap-6 sm:grid-cols-2">
            <Alan label="Telefon">
              <input type="tel" className={inp} value={form.phone ?? ""} onChange={set("phone")} placeholder="05xx xxx xx xx" />
            </Alan>
            <Alan label="E-posta">
              <input type="email" className={inp} value={form.email ?? ""} onChange={set("email")} placeholder="ornek@eposta.com" />
            </Alan>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Telefon <span className="text-primary-deep">veya</span> e-postadan biri yeterli.
          </p>
        </Bolum>

        <Ayrac />

        {/* 02 — Davetiye Teması: kartlar + canlı önizleme */}
        <Bolum
          no="02"
          kicker="Görünüm"
          baslik="🎨 Davetiye Teması"
          aciklama="Davetiyenizin ruhunu seçin. Seçtiğiniz tema, yandaki önizlemede anında canlanır."
        >
          <div className="grid gap-8 lg:grid-cols-[1fr_15rem] lg:items-start lg:gap-10">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
              {DAVETIYE_TEMALAR.map((t) => (
                <TemaKart key={t.id} tema={t} secili={tema === t.id} onSec={() => setTema(t.id)} />
              ))}
            </div>
            <div className="flex justify-center lg:sticky lg:top-24">
              <Telefon gelin={onGelin} damat={onDamat} tarih={onTarih} tema={aktifTema} boyut="kucuk" />
            </div>
          </div>
        </Bolum>

        <Ayrac />

        {/* 03 — Törenler: Kına & Düğün özel paneller */}
        <Bolum
          no="03"
          kicker="Törenler"
          baslik="Her tören, ayrı bir an"
          aciklama="Kına ve düğün, davetiyenizin en önemli iki anı. Her birini kendi alanında, özenle anlatın."
        >
          <div className="space-y-6">
            <OzelToren
              emoji="🌹"
              baslik="Kına Gecesi"
              alt="Kınanız hangi akşam, nerede yakılacak?"
              tema="kina"
              onek="Kına"
              e={kina}
              on={setK}
            />
            <OzelToren
              emoji="💍"
              baslik="Düğün Töreni"
              alt="Mutluluğa adım attığınız gün."
              tema="dugun"
              onek="Düğün"
              e={dugun}
              on={setD}
            />

            {/* Ek törenler — isteğe bağlı, sakin */}
            {ekstra.map((x, i) => (
              <div key={i} className="rounded-3xl border border-dashed border-border bg-background/30 p-6 sm:p-7">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="font-display text-lg italic text-muted-foreground">Ek Tören</span>
                    <select
                      className="rounded-full border border-border bg-card px-3 py-1.5 text-sm outline-none focus:border-primary"
                      value={x.tur}
                      onChange={(ev) => setE(i, "tur", ev.target.value)}
                    >
                      {EK_TURLER.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <button type="button" onClick={() => ekSil(i)} aria-label="Töreni kaldır" className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-rose-soft hover:text-rose">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <TorenAlanlar onek="" e={x} on={(k, v) => setE(i, k, v)} />
              </div>
            ))}

            <button
              type="button"
              onClick={ekEkle}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-border py-3.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary-deep"
            >
              <Plus className="h-4 w-4" /> Başka bir tören ekle (nişan, nikah…)
            </button>
          </div>
        </Bolum>

        <Ayrac />

        {/* 03 — Fotoğraflar */}
        <Bolum
          no="04"
          kicker="Görseller"
          baslik="Yüzünüz davetiyeye düşsün"
          aciklama="Gelin ve damat portreleri ile dilerseniz bir anı galerisi. Tümü isteğe bağlı."
        >
          <div className="grid grid-cols-2 gap-4 sm:gap-5">
            <TekFoto label="Gelin Portresi" file={gelinFoto} onSec={setGelinFoto} />
            <TekFoto label="Damat Portresi" file={damatFoto} onSec={setDamatFoto} />
          </div>
          <div className="mt-7">
            <Etiket>Anı Galerisi · en fazla {MAKS_FOTO}</Etiket>
            <label className="mt-2 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-border bg-background/30 px-4 py-9 text-center text-sm text-muted-foreground transition-colors hover:border-primary hover:bg-primary-soft/15">
              <Upload className="h-5 w-5" />
              <span>Fotoğraf eklemek için dokunun</span>
              <span className="text-xs text-muted-foreground/70">JPG · PNG — her biri en fazla 25 MB</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => galeriEkle(e.target.files)} />
            </label>
            {galeri.length > 0 && (
              <div className="mt-4 grid grid-cols-4 gap-2.5 sm:grid-cols-6">
                {galeri.map((f, i) => (
                  <div key={i} className="relative aspect-square overflow-hidden rounded-2xl border border-border">
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

        <Ayrac />

        {/* 04 — Aile */}
        <Bolum
          no="05"
          kicker="Takdim"
          baslik="Aileleriniz de orada olsun"
          aciklama="Davetiyede yer almasını istediğiniz aile takdimleri (isteğe bağlı)."
        >
          <div className="grid gap-7 sm:grid-cols-2">
            <Alan label="Gelin Tarafı">
              <textarea className={`${inp} min-h-20 resize-y`} value={form.gelin_aile ?? ""} onChange={set("gelin_aile")} placeholder="… ailesi" />
            </Alan>
            <Alan label="Damat Tarafı">
              <textarea className={`${inp} min-h-20 resize-y`} value={form.damat_aile ?? ""} onChange={set("damat_aile")} placeholder="… ailesi" />
            </Alan>
          </div>
        </Bolum>

        <Ayrac />

        {/* 05 — Müzik */}
        <Bolum
          no="06"
          kicker="Atmosfer"
          baslik="🎵 Davetiye Müziği"
          aciklama="Davetiyeniz açıldığında çalacak melodi. Sizi en iyi anlatan parça hangisi?"
        >
          <div className="overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary-soft/50 via-card to-card p-6 sm:p-7">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <Music className="h-5 w-5" />
              </span>
              <div>
                <p className="inline-flex items-center rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
                  Önerilen
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-foreground/80">
                  YouTube bağlantısı paylaşmanız yeterli — teknik işlemleri biz hallederiz.
                </p>
              </div>
            </div>
            <div className="mt-6">
              <Etiket>YouTube Bağlantısı</Etiket>
              <input className={`${inpBeyaz} mt-2`} value={form.muzik_youtube ?? ""} onChange={set("muzik_youtube")} placeholder="https://youtube.com/…" />
            </div>
          </div>

          <div className="mt-5">
            <Etiket>Dilerseniz kendi ses dosyanız · MP3 / WAV / M4A</Etiket>
            <label className="mt-2 flex cursor-pointer items-center gap-3 rounded-2xl border border-border bg-background/30 px-4 py-3.5 text-sm text-muted-foreground transition-colors hover:border-primary">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-primary-deep">
                <Play className="h-4 w-4" />
              </span>
              <span className="truncate">{muzik ? muzik.name : "Ses dosyası seçin"}</span>
              <input type="file" accept=".mp3,.wav,.m4a,audio/*" className="hidden" onChange={(e) => setMuzik(e.target.files?.[0] ?? null)} />
            </label>
          </div>
        </Bolum>

        <Ayrac />

        {/* 07 — Davet Metni (davetiyede GÖRÜNEN metin → form.mesaj) */}
        <Bolum
          no="07"
          kicker="Davet Sözünüz"
          baslik="Davetiyede ne yazsın?"
          aciklama="Misafirlerinizin davetiyede okuyacağı metin. Hazır bir metin seçin, yapay zekâdan ilham alın ya da kendiniz yazın."
        >
          <div className="mb-5 overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary-soft/50 via-card to-card p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Davet metni için ilham mı lazım?
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Yapay zekâ, isimlerinize özel 3 öneri hazırlasın.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAiAcik(true)}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-elegant transition-all hover:brightness-110"
              >
                <Sparkles className="h-4 w-4" /> AI ile Yardım Al
              </button>
            </div>
          </div>

          <Etiket>Hazır metinler</Etiket>
          <div className="mb-4 mt-2 grid gap-2 sm:grid-cols-2">
            {HAZIR_METINLER.map((m) => {
              const secili = (form.mesaj ?? "").trim() === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => mesajaAktar(m)}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm transition-all ${
                    secili
                      ? "border-primary bg-primary-soft/40 ring-2 ring-primary/30"
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  {m}
                </button>
              );
            })}
          </div>

          <Etiket>Davet metniniz</Etiket>
          <textarea
            className={`${inp} mt-2 min-h-28 resize-y`}
            value={form.mesaj ?? ""}
            onChange={set("mesaj")}
            placeholder="Davetiyede görünmesini istediğiniz metni yazın ya da yukarıdan seçin…"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Boş bırakırsanız zarif bir varsayılan metin kullanılır.
          </p>
        </Bolum>

        <Ayrac />

        {/* 08 — Notlar (yalnız tasarım ekibine — davetiyede GÖRÜNMEZ) */}
        <Bolum
          no="08"
          kicker="Son Dokunuş"
          baslik="Tasarım ekibine notunuz"
          aciklama="Renk tercihi, tarz, özel istekler… Bu not yalnızca ekibimize iletilir, davetiyede görünmez."
        >
          <div className="mb-2 flex items-center justify-between gap-3">
            <Etiket>Özel istekleriniz</Etiket>
            <button
              type="button"
              onClick={() => setNotAiAcik(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 px-3.5 py-1.5 text-xs font-medium text-primary-deep transition-colors hover:bg-primary-soft/50"
            >
              <Sparkles className="h-3.5 w-3.5" /> Notunuz için AI&apos;dan yardım alın
            </button>
          </div>
          <textarea className={`${inp} min-h-28 resize-y`} value={form.notlar ?? ""} onChange={set("notlar")} placeholder="Eklemek istedikleriniz…" />
        </Bolum>

        {hata && (
          <p className="mt-10 rounded-2xl bg-rose-soft px-5 py-4 text-sm font-medium text-rose">{hata}</p>
        )}

        <div className="mt-12">
          <button
            type="submit"
            disabled={durum === "gonderiliyor"}
            className="btn-luxe inline-flex w-full items-center justify-center gap-2.5 rounded-full py-[1.15rem] text-base font-semibold text-primary-foreground transition-all disabled:opacity-60"
          >
            {durum === "gonderiliyor" ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> {asama || "Gönderiliyor…"}</>
            ) : (
              <>Davetiyemi Oluştur <ArrowRight className="h-5 w-5" /></>
            )}
          </button>
          <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
            Talebiniz sonrası ekibimiz tasarım için sizinle iletişime geçer. Hiçbir ön ödeme alınmaz.
          </p>
        </div>
      </form>

      {aiAcik && (
        <AiYardimModal
          gelin={form.gelin_ad ?? ""}
          damat={form.damat_ad ?? ""}
          tema={tema}
          tarih={trTarih(dugun.tarih) ?? trTarih(kina.tarih)}
          onAktar={mesajaAktar}
          onClose={() => setAiAcik(false)}
        />
      )}

      {notAiAcik && (
        <AiOneriModal
          baslik="Notunuz için AI yardımı"
          altBaslik="Çift hikâyesi, açıklama veya tasarım notu önerileri"
          endpoint="/api/ai/davetiye-not"
          secenekEtiket="Tür"
          secenekler={NOT_KATEGORILER}
          govde={(kategori) => ({
            kategori,
            gelin_ad: ilkAd(form.gelin_ad) || null,
            damat_ad: ilkAd(form.damat_ad) || null,
          })}
          aktarEtiket="Nota aktar"
          onAktar={notaAktar}
          onClose={() => setNotAiAcik(false)}
        />
      )}
    </div>
  );
}

/* =================================================================
   ALT BİLEŞENLER
   ================================================================= */

// Editöryal alt-çizgi input — "form kutusu" değil
const inp =
  "w-full border-0 border-b border-border bg-transparent px-0 pb-2 pt-1 text-[15px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-primary";
// Beyaz panel içindeki input (müzik kartı)
const inpBeyaz =
  "w-full rounded-xl border border-border bg-card px-4 py-3 text-[15px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-primary";

function Istatistik({ n, l }: { n: string; l: string }) {
  return (
    <div>
      <span className="font-display text-xl font-semibold text-foreground sm:text-2xl">{n}</span>
      <p className="text-xs text-muted-foreground">{l}</p>
    </div>
  );
}

function Etiket({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
      {children}
    </span>
  );
}

function Ayrac() {
  return <div className="divider-gold my-14 sm:my-16" />;
}

function Bolum({
  no,
  kicker,
  baslik,
  aciklama,
  children,
}: {
  no: string;
  kicker: string;
  baslik: string;
  aciklama?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <header className="mb-9 sm:mb-11">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-sm italic text-primary/60">{no}</span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/70">
            {kicker}
          </span>
        </div>
        <h2 className="font-display mt-3 text-[1.9rem] leading-[1.12] tracking-tight sm:text-4xl">
          {baslik}
        </h2>
        {aciklama && (
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground">{aciklama}</p>
        )}
      </header>
      {children}
    </motion.section>
  );
}

function Alan({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <Etiket>{label}</Etiket>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

// Gelin & Damat — ortalı, eşit genişlik, aynı yükseklik, zarif italik
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
    <label className="flex flex-col text-center">
      <span className="text-[11px] font-semibold uppercase tracking-[0.26em] text-primary-deep/80">
        {label}
      </span>
      <input
        className="mt-3 w-full border-0 border-b border-border bg-transparent pb-2.5 pt-1 text-center font-display text-xl italic text-foreground outline-none transition-colors placeholder:not-italic placeholder:font-sans placeholder:text-[15px] placeholder:tracking-normal placeholder:text-muted-foreground/35 focus:border-primary sm:text-2xl"
        value={value}
        onChange={onChange}
        placeholder="Adı Soyadı"
      />
    </label>
  );
}

// Kına & Düğün — özel, ayrı, öne çıkan tören paneli
function OzelToren({
  emoji,
  baslik,
  alt,
  tema,
  onek,
  e,
  on,
}: {
  emoji: string;
  baslik: string;
  alt: string;
  tema: "kina" | "dugun";
  onek: string;
  e: Etkinlik;
  on: (k: keyof Etkinlik, v: string) => void;
}) {
  const stil =
    tema === "kina"
      ? "border-rose/70 from-rose-soft/70"
      : "border-primary/30 from-primary-soft/60";
  return (
    <section
      className={`relative overflow-hidden rounded-[2rem] border bg-gradient-to-br via-card to-card p-7 shadow-elegant sm:p-9 ${stil}`}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-3 -top-4 select-none text-[7rem] leading-none opacity-[0.07] sm:text-[9rem]"
      >
        {emoji}
      </span>
      <header className="relative mb-7">
        <h3 className="font-display text-2xl tracking-tight sm:text-[1.75rem]">
          <span className="mr-2">{emoji}</span>
          {baslik}
        </h3>
        <p className="mt-2 text-sm italic text-muted-foreground">{alt}</p>
      </header>
      <div className="relative">
        <TorenAlanlar onek={onek} e={e} on={on} />
      </div>
    </section>
  );
}

function TorenAlanlar({
  onek,
  e,
  on,
}: {
  onek: string;
  e: Etkinlik;
  on: (k: keyof Etkinlik, v: string) => void;
}) {
  const p = onek ? `${onek} ` : "";
  return (
    <div className="grid gap-x-7 gap-y-6 sm:grid-cols-2">
      <Alan label={`${p}Tarihi`}>
        <input type="date" className={inp} value={e.tarih ?? ""} onChange={(ev) => on("tarih", ev.target.value)} />
      </Alan>
      <Alan label={`${p}Saati`}>
        <input type="time" className={inp} value={e.saat ?? ""} onChange={(ev) => on("saat", ev.target.value)} />
      </Alan>
      <Alan label={`${p}Mekânı`}>
        <input className={inp} value={e.mekan ?? ""} onChange={(ev) => on("mekan", ev.target.value)} placeholder="Örn. Sapphire Davet" />
      </Alan>
      <Alan label={`${p}Adresi`}>
        <input className={inp} value={e.adres ?? ""} onChange={(ev) => on("adres", ev.target.value)} placeholder="Mahalle, cadde, no" />
      </Alan>
      <div className="sm:col-span-2">
        <Alan label={`${p}Harita Linki`}>
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-0 top-1.5 h-4 w-4 text-muted-foreground/60" />
            <input className={`${inp} pl-6`} value={e.maps ?? ""} onChange={(ev) => on("maps", ev.target.value)} placeholder="https://maps.app.goo.gl/…" />
          </div>
        </Alan>
      </div>
    </div>
  );
}

function TekFoto({ label, file, onSec }: { label: string; file: File | null; onSec: (f: File | null) => void }) {
  return (
    <div>
      <Etiket>{label}</Etiket>
      <label className="mt-2 flex aspect-[4/5] cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-3xl border border-dashed border-border bg-background/30 text-center text-sm text-muted-foreground transition-colors hover:border-primary">
        {file ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={URL.createObjectURL(file)} alt="" className="h-full w-full object-cover" />
        ) : (
          <>
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Upload className="h-4 w-4" />
            </span>
            <span className="text-xs">Fotoğraf seçin</span>
          </>
        )}
        <input type="file" accept="image/*" className="hidden" onChange={(ev) => onSec(ev.target.files?.[0] ?? null)} />
      </label>
    </div>
  );
}

// Tema kartı — seçilen tema belirgin (ring + onay). Mini davetiye swatch'ı.
function TemaKart({ tema, secili, onSec }: { tema: DavetiyeTema; secili: boolean; onSec: () => void }) {
  return (
    <button
      type="button"
      onClick={onSec}
      aria-pressed={secili}
      className={`group relative overflow-hidden rounded-2xl border bg-card p-1.5 text-left transition-all ${
        secili
          ? "border-primary ring-2 ring-primary/30"
          : "border-border hover:border-primary/40"
      }`}
    >
      {/* Mini davetiye önizlemesi — temanın gerçek görünümü (zemin, yazı, vurgu, buton) */}
      <div
        className="flex h-36 flex-col items-center justify-center gap-1 rounded-xl px-3 text-center"
        style={{ background: tema.bg, color: tema.yazi }}
      >
        <span className="text-[7px] font-semibold tracking-[0.3em]" style={{ color: tema.alt }}>
          DAVETLİSİNİZ
        </span>
        <span className="font-display text-[15px] leading-tight" style={{ color: tema.yazi }}>
          Bengisu
        </span>
        <span className="font-display text-base italic leading-none" style={{ color: tema.vurgu }}>
          &amp;
        </span>
        <span className="font-display text-[15px] leading-tight" style={{ color: tema.yazi }}>
          Furkan
        </span>
        <span className="my-1 h-px w-8" style={{ background: tema.vurgu, opacity: 0.55 }} />
        <span
          className="rounded-full px-3 py-1 text-[7px] font-semibold tracking-wide"
          style={{ background: tema.vurgu, color: tema.butonYazi }}
        >
          Davetiyeyi Aç
        </span>
      </div>
      <div className="flex items-center justify-between px-1.5 py-2">
        <span className="text-sm font-medium">{tema.ad}</span>
        {secili && <CheckCircle2 className="h-4 w-4 text-primary" />}
      </div>
    </button>
  );
}

// Canlı davetiye önizlemesi — seçilen temanın renkleriyle, gerçek davetiyenin
// mini versiyonu. İsimler daima stacked & ile gösterilir.
function Telefon({
  gelin,
  damat,
  tarih,
  tema,
  boyut = "buyuk",
}: {
  gelin: string;
  damat: string;
  tarih: string;
  tema: DavetiyeTema;
  boyut?: "buyuk" | "kucuk";
}) {
  const kucuk = boyut === "kucuk";
  return (
    <div
      className={`relative aspect-[9/19] rounded-[2.6rem] border border-border bg-card p-2.5 shadow-elegant ${
        kucuk ? "w-[210px]" : "w-full max-w-[300px]"
      }`}
    >
      {/* Dynamic island */}
      <div className="absolute left-1/2 top-3.5 z-20 h-5 w-20 -translate-x-1/2 rounded-full bg-[#0e0e0e]" />
      <div
        className="relative flex h-full flex-col overflow-hidden rounded-[2.1rem]"
        style={{ background: tema.bg, color: tema.yazi }}
      >
        <div className="relative flex flex-1 flex-col items-center justify-center px-5 text-center">
          <p className="font-display text-[10px] tracking-[0.34em]" style={{ color: tema.alt }}>
            DAVETLİSİNİZ
          </p>
          <CiftIsim
            gelin={gelin}
            damat={damat}
            className="mt-4"
            isimClassName={`font-display leading-tight ${kucuk ? "text-lg" : "text-2xl"}`}
            ampClassName={`font-display italic ${kucuk ? "text-base" : "text-xl"}`}
            ampStyle={{ color: tema.vurgu }}
          />
          <div className="mx-auto mt-4 h-px w-12" style={{ background: tema.vurgu, opacity: 0.5 }} />
          <p className="mt-4 text-[11px] tracking-[0.18em]" style={{ color: tema.alt }}>
            {tarih.toUpperCase()}
          </p>
          <span
            className={`mt-7 inline-flex items-center gap-1.5 rounded-full px-5 py-2 font-semibold ${
              kucuk ? "text-[10px]" : "text-[11px]"
            }`}
            style={{ background: tema.vurgu, color: tema.butonYazi }}
          >
            <Play className="h-3 w-3 fill-current" /> Davetiyeyi Aç
          </span>
        </div>
        <p className="relative pb-5 text-center text-[9px] tracking-[0.2em]" style={{ color: tema.alt, opacity: 0.55 }}>
          WeddinAI
        </p>
      </div>
      {/* canlı rozet — yalnızca büyük (hero) önizlemede */}
      {!kucuk && (
        <div className="absolute -left-3 top-16 hidden items-center gap-1.5 rounded-full border border-border bg-card/95 px-3 py-1.5 text-[11px] font-medium shadow-elegant backdrop-blur sm:flex">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" /> Canlı önizleme
        </div>
      )}
    </div>
  );
}

function Bitis({ gelin, damat }: { gelin: string; damat: string }) {
  return (
    <section className="tema-fildisi bg-aura flex min-h-[70vh] items-center justify-center px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="w-full max-w-lg text-center"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-primary">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <p className="mt-7 text-[11px] font-semibold uppercase tracking-[0.26em] text-primary-deep/70">
          Talebiniz alındı
        </p>
        <CiftIsim
          gelin={gelin}
          damat={damat}
          className="mt-4"
          isimClassName="font-display text-3xl leading-tight sm:text-4xl"
          ampClassName="font-display text-2xl italic text-primary sm:text-3xl"
        />
        <p className="mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-muted-foreground">
          Tasarım ekibimiz en kısa sürede sizinle iletişime geçip davetiyenizi
          hazırlamaya başlayacak. İlk taslağı 24 saat içinde paylaşırız.
        </p>
        <Link
          href="/"
          className="btn-luxe mt-9 inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-primary-foreground"
        >
          Ana sayfaya dön
        </Link>
      </motion.div>
    </section>
  );
}
