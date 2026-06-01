"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadCloud,
  Image as ImageIcon,
  Video,
  Mic,
  PenLine,
  Heart,
  CheckCircle2,
  Square,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Etkinlik } from "@/lib/mock-data";
import { aniDefteri, medyaListesi, ETKINLIK_TURU_ETIKET } from "@/lib/mock-data";

// ISO içinden saat:dakika çıkarır (SSR/CSR uyumlu, hydration güvenli)
function formatSaatGuvenli(iso: string): string {
  const t = iso.split("T")[1] ?? "";
  return t.slice(0, 5);
}

type Sekme = "yukle" | "ani-defteri" | "akis";

interface YuklemeDosya {
  id: string;
  ad: string;
  tur: "fotograf" | "video";
  ilerleme: number;
  tamam: boolean;
}

export function GuestApp({ etkinlik }: { etkinlik: Etkinlik }) {
  const [sekme, setSekme] = useState<Sekme>("yukle");

  const sekmeler: { id: Sekme; etiket: string; icon: typeof UploadCloud }[] = [
    { id: "yukle", etiket: "Anı Yükle", icon: UploadCloud },
    { id: "ani-defteri", etiket: "Anı Defteri", icon: PenLine },
    { id: "akis", etiket: "Sosyal Akış", icon: Heart },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-aura">
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-rose-soft via-primary-soft to-background opacity-70" />
        <div className="relative mx-auto max-w-2xl px-5 pb-10 pt-16 text-center">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card/70 px-4 py-1.5 text-xs font-medium text-[#9c7740]"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {ETKINLIK_TURU_ETIKET[etkinlik.event_type]}
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display mt-5 text-4xl font-semibold tracking-tight sm:text-5xl"
          >
            {etkinlik.title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-3 text-muted-foreground"
          >
            Bu özel anın bir parçası olun — fotoğraf, video ve anılarınızı
            paylaşın 💛
          </motion.p>
        </div>
      </header>

      {/* Sekmeler */}
      <div className="sticky top-0 z-30 border-y border-border/60 bg-card/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center gap-1 px-3">
          {sekmeler.map((s) => {
            const Icon = s.icon;
            const aktif = sekme === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setSekme(s.id)}
                className="relative flex flex-1 items-center justify-center gap-2 py-3.5 text-sm font-medium transition-colors"
              >
                <Icon
                  className={`h-4 w-4 ${aktif ? "text-primary" : "text-muted-foreground"}`}
                />
                <span className={aktif ? "text-foreground" : "text-muted-foreground"}>
                  {s.etiket}
                </span>
                {aktif && (
                  <motion.div
                    layoutId="sekme-cizgi"
                    className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-primary"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* İçerik */}
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-8">
        <AnimatePresence mode="wait">
          {sekme === "yukle" && (
            <motion.div
              key="yukle"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <YuklemeAlani />
            </motion.div>
          )}
          {sekme === "ani-defteri" && (
            <motion.div
              key="ani"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <AniDefteriAlani />
            </motion.div>
          )}
          {sekme === "akis" && (
            <motion.div
              key="akis"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <SosyalAkis />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="py-8 text-center text-xs text-muted-foreground">
        <span className="font-display">WeddinAI</span> ile güçlendirilmiştir
      </footer>
    </div>
  );
}

/* ----------------------- Yükleme Alanı ----------------------- */
function YuklemeAlani() {
  const [dosyalar, setDosyalar] = useState<YuklemeDosya[]>([]);
  const [adim, setAdim] = useState<"bos" | "yukleniyor" | "tamam">("bos");
  const inputRef = useRef<HTMLInputElement>(null);

  function dosyaSec(secilen: FileList | null) {
    if (!secilen || secilen.length === 0) return;
    const yeni: YuklemeDosya[] = Array.from(secilen).map((f, i) => ({
      id: `${Date.now()}_${i}`,
      ad: f.name,
      tur: f.type.startsWith("video") ? "video" : "fotograf",
      ilerleme: 0,
      tamam: false,
    }));
    setDosyalar(yeni);
    setAdim("yukleniyor");
    // Mock chunked upload simülasyonu
    yeni.forEach((d, idx) => {
      const interval = setInterval(() => {
        setDosyalar((onceki) =>
          onceki.map((x) => {
            if (x.id !== d.id) return x;
            const sonraki = Math.min(x.ilerleme + Math.random() * 18 + 6, 100);
            return { ...x, ilerleme: sonraki, tamam: sonraki >= 100 };
          }),
        );
      }, 220 + idx * 60);
      setTimeout(() => clearInterval(interval), 4000 + idx * 400);
    });
    setTimeout(() => setAdim("tamam"), 4200 + yeni.length * 200);
  }

  if (adim === "tamam") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-3xl border border-border bg-card p-10 text-center shadow-elegant"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 14 }}
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-primary"
        >
          <CheckCircle2 className="h-9 w-9" />
        </motion.div>
        <h3 className="font-display mt-5 text-xl font-semibold">
          Teşekkürler! 💛
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {dosyalar.length} anınız başarıyla yüklendi. Çiftin galerisinde yerini
          aldı.
        </p>
        <Button
          className="mt-6"
          variant="soft"
          onClick={() => {
            setDosyalar([]);
            setAdim("bos");
          }}
        >
          Yeni Anı Yükle
        </Button>
      </motion.div>
    );
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => dosyaSec(e.target.files)}
      />
      <button
        onClick={() => inputRef.current?.click()}
        className="glass group flex w-full flex-col items-center rounded-3xl border-2 border-dashed border-primary/30 px-6 py-14 text-center transition-colors hover:border-primary/60"
      >
        <motion.span
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-elegant"
        >
          <UploadCloud className="h-8 w-8" />
        </motion.span>
        <p className="font-display mt-5 text-lg font-semibold">
          Fotoğraf & video yüklemek için dokunun
        </p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Aynı anda birden fazla dosya seçebilirsiniz · 4K destekli
        </p>
        <div className="mt-5 flex gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5">
            <ImageIcon className="h-3.5 w-3.5" /> Fotoğraf
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5">
            <Video className="h-3.5 w-3.5" /> Video
          </span>
        </div>
      </button>

      <AnimatePresence>
        {dosyalar.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-5 space-y-3"
          >
            {dosyalar.map((d) => (
              <div
                key={d.id}
                className="glass rounded-2xl border border-border/60 p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-[#9c7740]">
                    {d.tur === "video" ? (
                      <Video className="h-5 w-5" />
                    ) : (
                      <ImageIcon className="h-5 w-5" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{d.ad}</p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-accent to-primary"
                        animate={{ width: `${d.ilerleme}%` }}
                        transition={{ ease: "easeOut" }}
                      />
                    </div>
                  </div>
                  <span className="w-10 shrink-0 text-right text-xs font-medium text-muted-foreground">
                    {d.tamam ? (
                      <CheckCircle2 className="ml-auto h-4 w-4 text-primary" />
                    ) : (
                      `${Math.round(d.ilerleme)}%`
                    )}
                  </span>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ----------------------- Anı Defteri ----------------------- */
function AniDefteriAlani() {
  const [mesaj, setMesaj] = useState("");
  const [isim, setIsim] = useState("");
  const [gonderildi, setGonderildi] = useState(false);
  const [kayitta, setKayitta] = useState(false);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-elegant">
        <h3 className="font-display text-lg font-semibold">Bir not bırakın</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Çifte içten dileklerinizi yazın veya sesli mesaj bırakın.
        </p>

        {gonderildi ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-5 rounded-2xl bg-primary-soft p-5 text-center"
          >
            <CheckCircle2 className="mx-auto h-7 w-7 text-primary" />
            <p className="mt-2 text-sm font-medium text-[#9c7740]">
              Anınız deftere eklendi, teşekkürler!
            </p>
          </motion.div>
        ) : (
          <>
            <input
              value={isim}
              onChange={(e) => setIsim(e.target.value)}
              placeholder="Adınız Soyadınız"
              className="mt-5 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
            />
            <textarea
              value={mesaj}
              onChange={(e) => setMesaj(e.target.value)}
              placeholder="Dileğinizi buraya yazın..."
              rows={4}
              className="mt-3 w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
            />
            <div className="mt-4 flex items-center gap-3">
              <Button
                className="flex-1"
                onClick={() => setGonderildi(true)}
                disabled={!mesaj.trim() || !isim.trim()}
              >
                <PenLine className="h-4 w-4" />
                Gönder
              </Button>
              <button
                onClick={() => setKayitta((v) => !v)}
                className={`flex h-11 items-center gap-2 rounded-full px-5 text-sm font-medium transition-colors ${
                  kayitta
                    ? "bg-rose text-white"
                    : "border border-primary/40 text-foreground hover:bg-primary-soft/50"
                }`}
              >
                {kayitta ? (
                  <>
                    <Square className="h-3.5 w-3.5 fill-current" /> Durdur
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4" /> Sesli
                  </>
                )}
              </button>
            </div>
            {kayitta && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 flex items-center justify-center gap-1.5"
              >
                {Array.from({ length: 24 }).map((_, i) => (
                  <motion.span
                    key={i}
                    className="w-1 rounded-full bg-rose"
                    animate={{ height: [6, Math.random() * 26 + 8, 6] }}
                    transition={{
                      duration: 0.7,
                      repeat: Infinity,
                      delay: i * 0.05,
                    }}
                  />
                ))}
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Önceki notlar */}
      <div className="space-y-3">
        <h4 className="font-display px-1 text-sm font-semibold text-muted-foreground">
          Diğer misafirlerden
        </h4>
        {aniDefteri.map((a) => (
          <div
            key={a.id}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <div className="flex items-center justify-between">
              <p className="font-display font-semibold">{a.guest_name}</p>
              <span className="text-xs text-muted-foreground">
                {formatSaatGuvenli(a.created_at)}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-foreground/80">
              {a.message}
            </p>
            {a.has_audio && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">
                <Mic className="h-3.5 w-3.5 text-primary" /> Sesli mesaj · 0:14
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ----------------------- Sosyal Akış ----------------------- */
function SosyalAkis() {
  const [begeniler, setBegeniler] = useState<Record<string, boolean>>({});
  const oran: Record<string, string> = {
    dikey: "aspect-[3/4]",
    kare: "aspect-square",
    yatay: "aspect-[4/3]",
  };

  return (
    <div className="columns-2 gap-4 [column-fill:_balance] sm:columns-3">
      {medyaListesi
        .filter((m) => m.status === "onaylandi")
        .map((m) => {
          const begenildi = begeniler[m.id];
          return (
            <div key={m.id} className="mb-4 break-inside-avoid">
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <div
                  className={`relative ${oran[m.ratio]} w-full bg-gradient-to-br ${m.tone}`}
                >
                  <button
                    onClick={() =>
                      setBegeniler((p) => ({ ...p, [m.id]: !p[m.id] }))
                    }
                    className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/25 px-2.5 py-1 text-xs font-medium text-white backdrop-blur"
                  >
                    <Heart
                      className={`h-3.5 w-3.5 ${begenildi ? "fill-rose text-rose" : ""}`}
                    />
                    {m.likes + (begenildi ? 1 : 0)}
                  </button>
                </div>
                <p className="px-3 py-2 text-xs text-muted-foreground">
                  {m.guest_name}
                </p>
              </div>
            </div>
          );
        })}
    </div>
  );
}
