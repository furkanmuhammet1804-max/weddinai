"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Play,
  Pause,
  ChevronDown,
  MapPin,
  CalendarHeart,
  Heart,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { temaBul, type DavetiyeTemaId } from "@/lib/davetiye-tema";
import { CiftIsim } from "@/components/davetiye/cift-isim";
import { AileBlogu } from "@/components/davetiye/aile-blogu";

interface Etk {
  tur: string;
  tarih?: string | null;
  saat?: string | null;
  mekan?: string | null;
  adres?: string | null;
  maps?: string | null;
}
interface Data {
  slug: string;
  tema: DavetiyeTemaId | string | null;
  gelin: string;
  damat: string;
  etkinlikler: Etk[];
  gelinFoto: string | null;
  damatFoto: string | null;
  galeri: string[];
  muzikUrl: string | null;
  muzikYoutube: string | null;
  mesaj: string | null;
  gelinAile: string | null;
  damatAile: string | null;
}

// CSS değişken kısayolları — tema renkleri root'tan türer (preview ile birebir).
const c = {
  yazi: "var(--dav-yazi)",
  alt: "var(--dav-alt)",
  vurgu: "var(--dav-vurgu)",
  butonYazi: "var(--dav-buton-yazi)",
  kartBg: "var(--dav-kart-bg)",
  kartBd: "var(--dav-kart-bd)",
} as const;

function parseDate(e: Etk): Date | null {
  if (!e.tarih) return null;
  const saat = e.saat && /^\d{2}:\d{2}/.test(e.saat) ? e.saat : "12:00";
  const d = new Date(`${e.tarih}T${saat}:00`);
  return isNaN(d.getTime()) ? null : d;
}
function hedefTarih(es: Etk[]): Date | null {
  const dated = es.map((e) => parseDate(e)).filter((d): d is Date => !!d);
  if (!dated.length) return null;
  const dugun = es.find((e) => /düğün|dugun|nikah/i.test(e.tur));
  if (dugun) { const d = parseDate(dugun); if (d) return d; }
  return dated.sort((a, b) => a.getTime() - b.getTime())[0];
}
function tarihTR(e: Etk): string {
  const d = parseDate(e);
  if (!d) return "";
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}
function mapsLink(e: Etk): string {
  if (e.maps) return e.maps;
  const q = [e.mekan, e.adres].filter(Boolean).join(" ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q || "konum")}`;
}
function ytId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

export function DavetiyeGoster({ data }: { data: Data }) {
  const tema = temaBul(data.tema);
  const kapak = data.gelinFoto ?? data.galeri[0] ?? data.damatFoto;
  const saveRef = useRef<HTMLElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [caliyor, setCaliyor] = useState(false);
  const [ytAcik, setYtAcik] = useState(false);
  const yt = data.muzikYoutube ? ytId(data.muzikYoutube) : null;
  const hedef = useMemo(() => hedefTarih(data.etkinlikler), [data.etkinlikler]);

  // Tema renklerini CSS değişkenlerine bağla — tüm alt bölümler bundan türer.
  const kokStil = {
    background: tema.bg,
    color: tema.yazi,
    "--dav-yazi": tema.yazi,
    "--dav-alt": tema.alt,
    "--dav-vurgu": tema.vurgu,
    "--dav-buton-yazi": tema.butonYazi,
    "--dav-kart-bg": `color-mix(in srgb, ${tema.yazi} 6%, transparent)`,
    "--dav-kart-bd": `color-mix(in srgb, ${tema.yazi} 16%, transparent)`,
  } as React.CSSProperties;

  // Kapak fotoğrafı varsa açılış ekranı fotoğrafın üstünde (beyaz metin);
  // yoksa tema zemini üzerinde tema renkleriyle.
  const heroYazi = kapak ? "#ffffff" : tema.yazi;
  const heroAlt = kapak ? "rgba(255,255,255,0.72)" : tema.alt;

  function muzikToggle() {
    if (data.muzikUrl && audioRef.current) {
      if (caliyor) { audioRef.current.pause(); setCaliyor(false); }
      else { audioRef.current.play().catch(() => {}); setCaliyor(true); }
      return;
    }
    if (yt) { setYtAcik((v) => !v); setCaliyor((v) => !v); }
  }
  function ac() {
    saveRef.current?.scrollIntoView({ behavior: "smooth" });
    if (!caliyor) muzikToggle();
  }

  return (
    <div
      className="h-[100svh] snap-y snap-mandatory overflow-y-scroll"
      style={kokStil}
      data-tema={tema.id}
    >
      {/* gizli müzik */}
      {data.muzikUrl && <audio ref={audioRef} src={data.muzikUrl} loop preload="none" />}
      {yt && ytAcik && (
        <iframe
          title="müzik"
          className="pointer-events-none fixed h-1 w-1 opacity-0"
          src={`https://www.youtube.com/embed/${yt}?autoplay=1&loop=1&playlist=${yt}`}
          allow="autoplay"
        />
      )}

      {/* sabit müzik butonu */}
      {(data.muzikUrl || yt) && (
        <button
          onClick={muzikToggle}
          className="fixed right-4 top-4 z-50 flex h-11 w-11 items-center justify-center rounded-full backdrop-blur transition"
          style={{
            marginTop: "env(safe-area-inset-top)",
            background: "rgba(0,0,0,0.38)",
            color: "#fff",
          }}
          aria-label="Müzik"
        >
          {caliyor ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </button>
      )}

      {/* 1) AÇILIŞ */}
      <section className="relative flex min-h-[100svh] snap-start items-center justify-center overflow-hidden">
        {kapak && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={kapak} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}
        {kapak && (
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/80" />
        )}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="relative z-10 px-6 text-center"
        >
          <p className="font-display text-sm tracking-[0.3em]" style={{ color: heroAlt }}>DAVETLİSİNİZ</p>
          <h1 className="sr-only">{data.gelin} & {data.damat} — Davetiye</h1>
          <CiftIsim
            gelin={data.gelin}
            damat={data.damat}
            className="mt-5"
            isimClassName="font-display text-4xl leading-[1.08] sm:text-6xl"
            ampClassName="font-display text-3xl italic sm:text-4xl"
            isimStyle={{ color: heroYazi }}
            ampStyle={{ color: tema.vurgu }}
          />
          <div className="mt-10 flex flex-col items-center gap-3">
            <button
              onClick={ac}
              className="rounded-full px-7 py-3 text-sm font-semibold shadow-lg transition hover:brightness-105"
              style={{ background: tema.vurgu, color: tema.butonYazi }}
            >
              Davetiyeyi Aç
            </button>
            {(data.muzikUrl || yt) && (
              <button
                onClick={muzikToggle}
                className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm backdrop-blur transition"
                style={{ borderColor: c.kartBd, color: heroYazi }}
              >
                {caliyor ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />} Müziği {caliyor ? "Durdur" : "Başlat"}
              </button>
            )}
          </div>
          <ChevronDown className="mx-auto mt-10 h-6 w-6 animate-bounce" style={{ color: heroAlt }} />
        </motion.div>
      </section>

      {/* 2) SAVE THE DATE */}
      <Bolum ref={saveRef}>
        <Ic>
          <p className="font-display text-sm tracking-[0.3em]" style={{ color: c.alt }}>SAVE THE DATE</p>
          {hedef && (
            <p className="font-display mt-6 text-5xl sm:text-7xl">
              {hedef.toLocaleDateString("tr-TR", { day: "2-digit" })}
              <span className="mx-2" style={{ color: c.vurgu }}>.</span>
              {hedef.toLocaleDateString("tr-TR", { month: "2-digit" })}
              <span className="mx-2" style={{ color: c.vurgu }}>.</span>
              {hedef.getFullYear()}
            </p>
          )}
          <CiftIsim
            gelin={data.gelin}
            damat={data.damat}
            className="mt-6"
            isimClassName="font-display text-2xl leading-[1.12]"
            ampClassName="font-display text-xl italic"
            ampStyle={{ color: c.vurgu }}
          />
        </Ic>
      </Bolum>

      {/* 3) GERİ SAYIM */}
      {hedef && (
        <Bolum>
          <Ic>
            <p className="font-display text-sm tracking-[0.3em]" style={{ color: c.alt }}>BÜYÜK GÜNE</p>
            <GeriSayim hedef={hedef} />
          </Ic>
        </Bolum>
      )}

      {/* 4) ETKİNLİKLER (+ 5 harita) */}
      {data.etkinlikler.length > 0 && (
        <Bolum>
          <Ic wide>
            <p className="font-display text-sm tracking-[0.3em]" style={{ color: c.alt }}>PROGRAM</p>
            <div className="mt-8 w-full space-y-4">
              {data.etkinlikler.map((e, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  className="rounded-2xl border p-5 text-left backdrop-blur"
                  style={{ borderColor: c.kartBd, background: c.kartBg }}
                >
                  <div className="flex items-center gap-2" style={{ color: c.vurgu }}>
                    <CalendarHeart className="h-4 w-4" />
                    <h3 className="font-display text-xl" style={{ color: c.yazi }}>{e.tur}</h3>
                  </div>
                  {(e.tarih || e.saat) && (
                    <p className="mt-2 text-sm" style={{ color: c.alt }}>{tarihTR(e)}{e.saat ? ` · ${e.saat}` : ""}</p>
                  )}
                  {e.mekan && <p className="mt-1 text-sm" style={{ color: c.yazi }}>{e.mekan}</p>}
                  {e.adres && <p className="text-sm" style={{ color: c.alt }}>{e.adres}</p>}
                  <a
                    href={mapsLink(e)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition hover:brightness-105"
                    style={{ background: c.vurgu, color: c.butonYazi }}
                  >
                    <MapPin className="h-4 w-4" /> Haritayı Aç
                  </a>
                </motion.div>
              ))}
            </div>
          </Ic>
        </Bolum>
      )}

      {/* 6) GALERİ (swipe) */}
      {data.galeri.length > 0 && (
        <Bolum>
          <Ic wide>
            <p className="font-display text-sm tracking-[0.3em]" style={{ color: c.alt }}>ANILAR</p>
            <div className="mt-6 flex w-full snap-x snap-mandatory gap-3 overflow-x-auto pb-3" style={{ scrollbarWidth: "none" }}>
              {data.galeri.map((u, i) => (
                <div key={i} className="relative aspect-[3/4] w-[78%] shrink-0 snap-center overflow-hidden rounded-2xl sm:w-[45%]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={u} alt="" loading="lazy" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs" style={{ color: c.alt, opacity: 0.7 }}>← kaydırın →</p>
          </Ic>
        </Bolum>
      )}

      {/* 7) RSVP */}
      <Bolum>
        <Ic>
          <p className="font-display text-sm tracking-[0.3em]" style={{ color: c.alt }}>KATILIM</p>
          <h2 className="font-display mt-4 text-3xl">Aramızda mısınız?</h2>
          <Rsvp slug={data.slug} />
        </Ic>
      </Bolum>

      {/* 8) TEŞEKKÜR */}
      <Bolum>
        <Ic>
          <Heart className="mx-auto h-10 w-10" style={{ color: c.vurgu, fill: c.vurgu }} />
          <p className="font-display mt-6 text-2xl leading-relaxed">
            {data.mesaj || "Bu özel günümüzde aramızda olmanız bizi mutlu eder."}
          </p>
          {(data.gelinAile || data.damatAile) && (
            <AileBlogu
              gelinAile={data.gelinAile}
              damatAile={data.damatAile}
              className="mt-7 text-base"
              adStyle={{ color: c.alt }}
              ayracStyle={{ background: c.vurgu }}
            />
          )}
          <CiftIsim
            gelin={data.gelin}
            damat={data.damat}
            className="mt-8"
            isimClassName="font-display text-xl leading-[1.12]"
            ampClassName="font-display text-lg italic"
            isimStyle={{ color: c.vurgu }}
            ampStyle={{ color: c.vurgu }}
          />
          <p className="mt-10 text-[11px] tracking-widest" style={{ color: c.alt, opacity: 0.7 }}>WeddinAI ile hazırlandı</p>
        </Ic>
      </Bolum>
    </div>
  );
}

const Bolum = function Bolum({
  children,
  ref,
}: {
  children: React.ReactNode;
  ref?: React.Ref<HTMLElement>;
}) {
  return (
    <section ref={ref} className="flex min-h-[100svh] snap-start items-center justify-center px-6 py-16">
      {children}
    </section>
  );
};

function Ic({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7 }}
      className={`w-full text-center ${wide ? "max-w-md" : "max-w-sm"}`}
    >
      {children}
    </motion.div>
  );
}

function GeriSayim({ hedef }: { hedef: Date }) {
  const [k, setK] = useState(() => kalan(hedef));
  useEffect(() => {
    const t = setInterval(() => setK(kalan(hedef)), 1000);
    return () => clearInterval(t);
  }, [hedef]);
  if (k.bitti) {
    return <p className="font-display mt-8 text-3xl" style={{ color: c.vurgu }}>Bugün! 🎉</p>;
  }
  const kutu = (v: number, l: string) => (
    <div className="flex flex-col items-center">
      <span className="font-display text-4xl sm:text-5xl tabular-nums">{String(v).padStart(2, "0")}</span>
      <span className="mt-1 text-[11px] tracking-widest" style={{ color: c.alt }}>{l}</span>
    </div>
  );
  return (
    <div className="mt-8 flex items-start justify-center gap-4 sm:gap-6">
      {kutu(k.gun, "GÜN")}
      {kutu(k.saat, "SAAT")}
      {kutu(k.dk, "DK")}
      {kutu(k.sn, "SN")}
    </div>
  );
}
function kalan(h: Date) {
  const ms = h.getTime() - Date.now();
  if (ms <= 0) return { bitti: true, gun: 0, saat: 0, dk: 0, sn: 0 };
  const sn = Math.floor(ms / 1000);
  return {
    bitti: false,
    gun: Math.floor(sn / 86400),
    saat: Math.floor((sn % 86400) / 3600),
    dk: Math.floor((sn % 3600) / 60),
    sn: sn % 60,
  };
}

function Rsvp({ slug }: { slug: string }) {
  const [ad, setAd] = useState("");
  const [kisi, setKisi] = useState(1);
  const [not, setNot] = useState("");
  const [durum, setDurum] = useState<"form" | "gonderiliyor" | "tamam">("form");
  const [hata, setHata] = useState<string | null>(null);

  async function gonder(katilim: "evet" | "hayir") {
    if (durum === "gonderiliyor") return;
    setHata(null);
    if (!ad.trim()) { setHata("Lütfen adınızı yazın."); return; }
    setDurum("gonderiliyor");
    try {
      const res = await fetch("/api/davetiye/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, ad, katilim, kisi_sayisi: kisi, not }),
      });
      if (!res.ok) throw new Error();
      setDurum("tamam");
    } catch {
      setHata("Gönderilemedi. Tekrar deneyin.");
      setDurum("form");
    }
  }

  if (durum === "tamam") {
    return (
      <div className="mt-8 flex flex-col items-center gap-3">
        <CheckCircle2 className="h-10 w-10" style={{ color: c.vurgu }} />
        <p>Teşekkürler! Yanıtınız alındı. 💛</p>
      </div>
    );
  }

  const inpStil: React.CSSProperties = {
    borderColor: c.kartBd,
    background: c.kartBg,
    color: c.yazi,
  };
  const inp = "w-full rounded-xl border px-4 py-3 text-sm outline-none";
  return (
    <div className="mt-8 space-y-3 text-left">
      <input value={ad} onChange={(e) => setAd(e.target.value)} placeholder="Adınız Soyadınız" className={inp} style={inpStil} />
      <div className="flex items-center justify-between rounded-xl border px-4 py-2.5 text-sm" style={inpStil}>
        <span style={{ color: c.alt }}>Kişi sayısı</span>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setKisi((k) => Math.max(1, k - 1))} className="h-7 w-7 rounded-full" style={{ background: c.kartBd }}>−</button>
          <span className="w-5 text-center tabular-nums">{kisi}</span>
          <button type="button" onClick={() => setKisi((k) => Math.min(20, k + 1))} className="h-7 w-7 rounded-full" style={{ background: c.kartBd }}>+</button>
        </div>
      </div>
      <input value={not} onChange={(e) => setNot(e.target.value)} placeholder="Notunuz (opsiyonel)" className={inp} style={inpStil} />
      {hata && <p className="text-sm font-medium" style={{ color: c.vurgu }}>{hata}</p>}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <button
          type="button"
          disabled={durum === "gonderiliyor"}
          onClick={() => gonder("evet")}
          className="inline-flex items-center justify-center gap-1.5 rounded-full py-3 text-sm font-semibold transition hover:brightness-110 disabled:opacity-60"
          style={{ background: c.vurgu, color: c.butonYazi }}
        >
          {durum === "gonderiliyor" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4" />} Katılacağım
        </button>
        <button
          type="button"
          disabled={durum === "gonderiliyor"}
          onClick={() => gonder("hayir")}
          className="rounded-full border py-3 text-sm font-semibold transition disabled:opacity-60"
          style={{ borderColor: c.kartBd, color: c.yazi }}
        >
          Katılamayacağım
        </button>
      </div>
    </div>
  );
}
