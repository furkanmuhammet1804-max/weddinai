"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  AlertTriangle,
  Lock,
  RotateCw,
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

// Supabase Storage tek dosya sınırı (~50 MiB) ve makul bir toplu seçim üst sınırı.
const MAKS_DOSYA_BAYT = 50 * 1024 * 1024; // 50 MiB
const MAKS_DOSYA_ADET = 30;

type DosyaDurum = "bekliyor" | "yukleniyor" | "tamam" | "hata";

interface YuklemeDosya {
  id: string;
  ad: string;
  tur: "fotograf" | "video";
  boyut: number;
  ilerleme: number;
  durum: DosyaDurum;
  hata?: string;
  // önizleme için object URL (temizlenmesi gerekir)
  onizleme?: string;
}

function bytKbMb(bayt: number): string {
  if (bayt >= 1024 * 1024) return `${(bayt / (1024 * 1024)).toFixed(1)} MB`;
  if (bayt >= 1024) return `${Math.round(bayt / 1024)} KB`;
  return `${bayt} B`;
}

// Desteklenen MIME tipleri. HEIC/HEIF tarayıcıda görüntülenemez ve çoğu
// işleme akışında sorun çıkarır; net bir mesajla reddedilir.
function dosyaTuru(f: File): "fotograf" | "video" | null {
  const t = (f.type || "").toLowerCase();
  if (t.startsWith("image/")) {
    if (t.includes("heic") || t.includes("heif")) return null;
    return "fotograf";
  }
  if (t.startsWith("video/")) return "video";
  // Bazı mobil tarayıcılar type'ı boş bırakır → uzantıdan tahmin et.
  if (!t) {
    const ad = f.name.toLowerCase();
    if (/\.(jpe?g|png|gif|webp|avif)$/.test(ad)) return "fotograf";
    if (/\.(mp4|mov|webm|m4v)$/.test(ad)) return "video";
    if (/\.(heic|heif)$/.test(ad)) return null;
  }
  return null;
}

export function GuestApp({
  etkinlik,
  kapali = false,
}: {
  etkinlik: Etkinlik;
  kapali?: boolean;
}) {
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
              <YuklemeAlani kapali={kapali} />
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
function YuklemeAlani({ kapali }: { kapali: boolean }) {
  const [dosyalar, setDosyalar] = useState<YuklemeDosya[]>([]);
  const [adim, setAdim] = useState<"bos" | "yukleniyor" | "tamam">("bos");
  const [reddedilenler, setReddedilenler] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Çalışan zamanlayıcılar — unmount/yeniden yüklemede temizlenir (sızıntı önleme).
  const zamanlayicilar = useRef<ReturnType<typeof setInterval>[]>([]);
  // Aynı anda iki yükleme başlamasını engelle (çift dokunma koruması).
  const yukleniyorRef = useRef(false);

  const tumZamanlayicilariTemizle = useCallback(() => {
    zamanlayicilar.current.forEach((z) => clearInterval(z));
    zamanlayicilar.current = [];
  }, []);

  // Unmount'ta: zamanlayıcıları durdur ve object URL'leri serbest bırak.
  useEffect(() => {
    return () => {
      tumZamanlayicilariTemizle();
      setDosyalar((onceki) => {
        onceki.forEach((d) => d.onizleme && URL.revokeObjectURL(d.onizleme));
        return onceki;
      });
    };
  }, [tumZamanlayicilariTemizle]);

  // Tek bir dosyanın (mock) yüklemesini başlatır. Gerçek entegrasyonda
  // burası Supabase Storage upload çağrısıyla değiştirilecek.
  const dosyaYuklemeBaslat = useCallback((id: string) => {
    setDosyalar((o) =>
      o.map((x) =>
        x.id === id ? { ...x, durum: "yukleniyor", ilerleme: 0, hata: undefined } : x,
      ),
    );
    const interval = setInterval(() => {
      setDosyalar((onceki) =>
        onceki.map((x) => {
          if (x.id !== id || x.durum !== "yukleniyor") return x;
          const sonraki = Math.min(x.ilerleme + Math.random() * 18 + 6, 100);
          // Mock: deterministik olmayan ama nadir bir başarısızlık göstermek
          // yerine her zaman başarı simüle ediyoruz (gerçek hata yolu hazır).
          if (sonraki >= 100) {
            clearInterval(interval);
            return { ...x, ilerleme: 100, durum: "tamam" };
          }
          return { ...x, ilerleme: sonraki };
        }),
      );
    }, 240);
    zamanlayicilar.current.push(interval);
    // Güvenlik ağı: takılı kalan yüklemeyi belli süre sonra bitir.
    const guard = setTimeout(() => {
      clearInterval(interval);
      setDosyalar((onceki) =>
        onceki.map((x) =>
          x.id === id && x.durum === "yukleniyor"
            ? { ...x, ilerleme: 100, durum: "tamam" }
            : x,
        ),
      );
    }, 8000);
    zamanlayicilar.current.push(guard as unknown as ReturnType<typeof setInterval>);
  }, []);

  function dosyaSec(secilen: FileList | null) {
    // Çift dokunma / yükleme sürerken yeni seçim engellenir.
    if (yukleniyorRef.current) return;
    // 0 dosya (iptal): hiçbir şey yapma, durumu bozma.
    if (!secilen || secilen.length === 0) return;

    const hamListe = Array.from(secilen);
    const kabul: YuklemeDosya[] = [];
    const red: string[] = [];
    const gorulenAnahtar = new Set<string>();

    for (const f of hamListe) {
      // Üst adet sınırı.
      if (kabul.length >= MAKS_DOSYA_ADET) {
        red.push(
          `En fazla ${MAKS_DOSYA_ADET} dosya yükleyebilirsiniz; fazlası atlandı.`,
        );
        break;
      }
      // Yinelenen seçim (aynı ad + boyut) elenir.
      const anahtar = `${f.name}__${f.size}`;
      if (gorulenAnahtar.has(anahtar)) continue;
      gorulenAnahtar.add(anahtar);

      const tur = dosyaTuru(f);
      if (!tur) {
        red.push(`${f.name}: desteklenmeyen dosya türü (HEIC/diğer).`);
        continue;
      }
      if (f.size === 0) {
        red.push(`${f.name}: boş dosya.`);
        continue;
      }
      if (f.size > MAKS_DOSYA_BAYT) {
        red.push(
          `${f.name}: çok büyük (${bytKbMb(f.size)} · sınır 50 MB).`,
        );
        continue;
      }

      let onizleme: string | undefined;
      if (tur === "fotograf") {
        try {
          onizleme = URL.createObjectURL(f);
        } catch {
          onizleme = undefined;
        }
      }

      kabul.push({
        id: `${Date.now()}_${kabul.length}_${Math.random().toString(36).slice(2, 8)}`,
        ad: f.name,
        tur,
        boyut: f.size,
        ilerleme: 0,
        durum: "bekliyor",
        onizleme,
      });
    }

    setReddedilenler(red);

    // Geçerli dosya yoksa yükleme durumuna geçme.
    if (kabul.length === 0) return;

    setDosyalar(kabul);
    setAdim("yukleniyor");
    yukleniyorRef.current = true;
    kabul.forEach((d) => dosyaYuklemeBaslat(d.id));
  }

  // Yüklemelerin tamamlanışını izle; hepsi bitince (tamam/hata) genel durumu güncelle.
  useEffect(() => {
    if (adim !== "yukleniyor" || dosyalar.length === 0) return;
    const devamEden = dosyalar.some(
      (d) => d.durum === "yukleniyor" || d.durum === "bekliyor",
    );
    if (!devamEden) {
      yukleniyorRef.current = false;
      const hepsiBasarisiz = dosyalar.every((d) => d.durum === "hata");
      // Hepsi başarısızsa kullanıcı listede kalsın ve tekrar deneyebilsin.
      if (!hepsiBasarisiz) setAdim("tamam");
    }
  }, [dosyalar, adim]);

  const basariliSayisi = dosyalar.filter((d) => d.durum === "tamam").length;
  const hataliSayisi = dosyalar.filter((d) => d.durum === "hata").length;

  function yeniden(id: string) {
    // Başka yükleme sürse de tekil yeniden denemeye izin verilir.
    setAdim("yukleniyor");
    yukleniyorRef.current = true;
    dosyaYuklemeBaslat(id);
  }

  function sifirla() {
    tumZamanlayicilariTemizle();
    dosyalar.forEach((d) => d.onizleme && URL.revokeObjectURL(d.onizleme));
    yukleniyorRef.current = false;
    setDosyalar([]);
    setReddedilenler([]);
    setAdim("bos");
    if (inputRef.current) inputRef.current.value = "";
  }

  // Etkinlik arşivlenmişse yükleme kapalı: net bilgi göster.
  if (kapali) {
    return (
      <div className="rounded-3xl border border-border bg-card p-10 text-center shadow-elegant">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Lock className="h-8 w-8" />
        </div>
        <h3 className="font-display mt-5 text-xl font-semibold">
          Yükleme kapandı
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          Bu etkinlik arşivlendi. Yeni anı yüklenemiyor, ancak paylaşılan anıları
          görüntülemeye devam edebilirsiniz.
        </p>
      </div>
    );
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
          {basariliSayisi} anınız başarıyla yüklendi. Çiftin galerisinde yerini
          aldı.
        </p>
        {hataliSayisi > 0 && (
          <p className="mt-2 text-sm text-rose">
            {hataliSayisi} dosya yüklenemedi.
          </p>
        )}
        <Button className="mt-6" variant="soft" onClick={sifirla}>
          Yeni Anı Yükle
        </Button>
      </motion.div>
    );
  }

  const yuklemeSuruyor = adim === "yukleniyor";

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        aria-label="Fotoğraf ve video seç"
        className="hidden"
        disabled={yuklemeSuruyor}
        onChange={(e) => dosyaSec(e.target.files)}
      />
      <button
        type="button"
        onClick={() => !yuklemeSuruyor && inputRef.current?.click()}
        disabled={yuklemeSuruyor}
        aria-label="Fotoğraf ve video yüklemek için dosya seç"
        aria-busy={yuklemeSuruyor}
        className="glass group flex w-full flex-col items-center rounded-3xl border-2 border-dashed border-primary/30 px-6 py-14 text-center transition-colors hover:border-primary/60 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <motion.span
          animate={yuklemeSuruyor ? { y: 0 } : { y: [0, -8, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-elegant"
        >
          <UploadCloud className="h-8 w-8" />
        </motion.span>
        <p className="font-display mt-5 text-lg font-semibold">
          {yuklemeSuruyor
            ? "Yükleniyor…"
            : "Fotoğraf & video yüklemek için dokunun"}
        </p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          En fazla {MAKS_DOSYA_ADET} dosya · dosya başına 50 MB
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

      {/* Reddedilen dosyalar için net uyarı */}
      <AnimatePresence>
        {reddedilenler.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role="alert"
            className="mt-4 rounded-2xl border border-rose/40 bg-rose/5 p-4 text-sm text-rose"
          >
            <p className="flex items-center gap-2 font-medium">
              <AlertTriangle className="h-4 w-4" /> Bazı dosyalar atlandı
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
              {reddedilenler.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

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
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary-soft text-[#9c7740]">
                    {d.onizleme ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={d.onizleme}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : d.tur === "video" ? (
                      <Video className="h-5 w-5" />
                    ) : (
                      <ImageIcon className="h-5 w-5" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{d.ad}</p>
                    <p className="text-xs text-muted-foreground">
                      {bytKbMb(d.boyut)}
                    </p>
                    {d.durum === "hata" ? (
                      <p className="mt-1 text-xs text-rose">
                        {d.hata ?? "Yükleme başarısız."}
                      </p>
                    ) : (
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-accent to-primary"
                          animate={{ width: `${d.ilerleme}%` }}
                          transition={{ ease: "easeOut" }}
                        />
                      </div>
                    )}
                  </div>
                  <span className="flex w-10 shrink-0 items-center justify-end text-right text-xs font-medium text-muted-foreground">
                    {d.durum === "tamam" ? (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    ) : d.durum === "hata" ? (
                      <button
                        type="button"
                        onClick={() => yeniden(d.id)}
                        aria-label={`${d.ad} dosyasını tekrar yükle`}
                        className="rounded-full p-1 text-rose hover:bg-rose/10"
                      >
                        <RotateCw className="h-4 w-4" />
                      </button>
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
