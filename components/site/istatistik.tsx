"use client";

// Ana sayfa — animasyonlu istatistik şeridi (görünür olunca sayaç çalışır).
// IntersectionObserver + rAF; tek seferlik. Reduced-motion'da anında hedefi gösterir.
import { useEffect, useRef, useState } from "react";

interface Stat {
  hedef: number;
  sonEk: string;
  etiket: string;
}

const STATLAR: Stat[] = [
  { hedef: 120000, sonEk: "+", etiket: "Toplanan Fotoğraf" },
  { hedef: 4500, sonEk: "+", etiket: "Etkinlik" },
  { hedef: 98, sonEk: "%", etiket: "Memnuniyet" },
  { hedef: 35, sonEk: " TB+", etiket: "Korunan Anı" },
];

function Sayac({ stat }: { stat: Stat }) {
  const [deger, setDeger] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const azalt = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (azalt) {
      // Animasyon kapalıysa doğrudan hedefi göster (tek seferlik, kasıtlı).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDeger(stat.hedef);
      return;
    }

    let rafId = 0;
    let basladi = false;
    const obs = new IntersectionObserver(
      (girisler) => {
        if (!girisler[0]?.isIntersecting || basladi) return;
        basladi = true;
        const sure = 1600;
        const t0 = performance.now();
        const tik = (now: number) => {
          const p = Math.min(1, (now - t0) / sure);
          // easeOutCubic
          const e = 1 - Math.pow(1 - p, 3);
          setDeger(Math.round(stat.hedef * e));
          if (p < 1) rafId = requestAnimationFrame(tik);
        };
        rafId = requestAnimationFrame(tik);
        obs.disconnect();
      },
      { threshold: 0.4 },
    );
    obs.observe(el);
    return () => {
      obs.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, [stat.hedef]);

  return (
    <div ref={ref} className="text-center">
      <p className="font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
        {deger.toLocaleString("tr-TR")}
        <span className="text-primary-deep">{stat.sonEk}</span>
      </p>
      <p className="mt-2 text-sm text-foreground/60">{stat.etiket}</p>
    </div>
  );
}

export function Istatistikler() {
  return (
    <section className="border-y border-border/60 bg-white/40 py-16 backdrop-blur">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-10 px-5 sm:px-8 lg:grid-cols-4">
        {STATLAR.map((s) => (
          <Sayac key={s.etiket} stat={s} />
        ))}
      </div>
    </section>
  );
}
