"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Images,
  PenLine,
  LogOut,
  Sparkles,
  Star,
  Loader2,
  Video as VideoIcon,
  Mic,
  Camera,
  CheckCircle2,
  Download,
  CheckSquare,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Trash2,
  Heart,
  QrCode,
  Share2,
  Clock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { blobIndir, formIleIndir } from "@/lib/indir";
import type { OdaBilgi, OdaMedya, OdaAni } from "@/lib/oda/veri";
import { turEtiket, tarihTR } from "@/lib/etkinlik";

type Sekme = "anilar" | "defter";

// Mobilde akıcı kalsın diye medya kartları parça parça (lazy) gösterilir.
const GOSTER_ADIM = 48;

// Bir medyanın indirme dosya adını üretir (sıra-no + isim + uzantı).
function dosyaAdi(m: OdaMedya, i: number): string {
  let ext = m.file_type === "video" ? "mp4" : "jpg";
  try {
    const p = new URL(m.url ?? "").pathname;
    const nokta = p.lastIndexOf(".");
    if (nokta >= 0) {
      const e = p.slice(nokta + 1).toLowerCase();
      if (/^[a-z0-9]{2,5}$/.test(e)) ext = e;
    }
  } catch {
    /* yoksay */
  }
  const ad =
    (m.guest_name ?? "ani")
      .replace(/[^\p{L}\p{N} _-]/gu, "")
      .trim()
      .slice(0, 30) || "ani";
  return `${String(i + 1).padStart(3, "0")}-${ad}.${ext}`;
}

export function MusteriPanel({
  slug,
  bilgi,
  medyalar,
  anilar,
}: {
  slug: string;
  bilgi: OdaBilgi;
  medyalar: OdaMedya[];
  anilar: OdaAni[];
}) {
  const router = useRouter();
  const [sekme, setSekme] = useState<Sekme>("anilar");
  const [liste, setListe] = useState<OdaMedya[]>(medyalar);
  const [cikis, setCikis] = useState(false);
  const [yenileniyor, setYenileniyor] = useState(false);

  // Seçim & indirme & lightbox
  const [secimModu, setSecimModu] = useState(false);
  const [secili, setSecili] = useState<Set<string>>(new Set());
  // Lightbox, konum yerine medya ID ile takip edilir → favori filtresi açılıp
  // kapanınca ya da liste değişince yanlış görsele atlamaz.
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [indirme, setIndirme] = useState<{
    mesaj: string;
    alt?: string;
  } | null>(null);
  const [gosterilen, setGosterilen] = useState(GOSTER_ADIM);
  const [favoriFiltre, setFavoriFiltre] = useState(false);
  const [qrAcik, setQrAcik] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Görüntülenen kaynak: favori filtresi açıksa yalnızca favoriler.
  const kaynak = favoriFiltre ? liste.filter((m) => m.is_favorite) : liste;

  // Bir içeriği favoriye ekler/çıkarır (iyimser).
  async function favoriToggle(m: OdaMedya) {
    const yeni = !m.is_favorite;
    setListe((o) =>
      o.map((x) => (x.id === m.id ? { ...x, is_favorite: yeni } : x)),
    );
    try {
      const res = await fetch("/api/oda/favori", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, mediaId: m.id, favori: yeni }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setListe((o) =>
        o.map((x) => (x.id === m.id ? { ...x, is_favorite: !yeni } : x)),
      );
    }
  }

  // Props değişince (router.refresh sonrası) listeyi tazele
  useEffect(() => {
    setListe(medyalar);
    setGosterilen(GOSTER_ADIM);
  }, [medyalar]);

  // Sonsuz kaydırma: sentinel görününce daha fazla kart yükle.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (girisler) => {
        if (girisler[0]?.isIntersecting) {
          setGosterilen((g) => Math.min(g + GOSTER_ADIM, kaynak.length));
        }
      },
      { rootMargin: "600px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [kaynak.length, sekme]);

  // Favori filtresi değişince baştan göster.
  useEffect(() => {
    setGosterilen(GOSTER_ADIM);
  }, [favoriFiltre]);

  // Seçilen içerikleri toplu siler.
  async function topluSil(medias: OdaMedya[]) {
    if (medias.length === 0) return;
    if (
      !window.confirm(
        `${medias.length} içeriği kalıcı olarak silmek istiyor musunuz? Bu işlem geri alınamaz.`,
      )
    )
      return;
    const idSet = new Set(medias.map((m) => m.id));
    setListe((o) => o.filter((x) => !idSet.has(x.id))); // iyimser
    setSecili(new Set());
    setSecimModu(false);
    try {
      const res = await fetch("/api/oda/medya-sil", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, mediaIds: [...idSet] }),
      });
      if (!res.ok) throw new Error();
    } catch {
      router.refresh();
    }
  }

  // Müşteri bir içeriği siler (depolama dosyası da temizlenir).
  async function silMedya(m: OdaMedya) {
    if (
      !window.confirm(
        "Bu içeriği kalıcı olarak silmek istiyor musunuz? Bu işlem geri alınamaz.",
      )
    )
      return;
    setListe((o) => o.filter((x) => x.id !== m.id)); // iyimser
    try {
      const res = await fetch("/api/oda/medya-sil", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, mediaId: m.id }),
      });
      if (!res.ok) throw new Error();
    } catch {
      router.refresh(); // başarısızsa gerçeği geri getir
    }
  }

  const fotoSayi = liste.filter((m) => m.file_type === "fotograf").length;
  const videoSayi = liste.filter((m) => m.file_type === "video").length;
  const showroomSayi = liste.filter((m) => m.showroom_approved).length;
  const bekleyenSayi = liste.filter(
    (m) => m.showroom_requested && !m.showroom_approved,
  ).length;
  const favoriSayi = liste.filter((m) => m.is_favorite).length;

  async function cikisYap() {
    if (cikis) return;
    setCikis(true);
    try {
      await fetch("/api/oda/cikis", { method: "POST" });
    } catch {
      /* yine de yönlendir */
    }
    router.refresh();
  }

  function yenile() {
    if (yenileniyor) return;
    setYenileniyor(true);
    router.refresh();
    // Görsel geri bildirim için kısa süre sonra kapat
    setTimeout(() => setYenileniyor(false), 1200);
  }

  // ---- İndirme ----
  const tekBlobIndir = useCallback(async (m: OdaMedya, i: number) => {
    if (!m.url) return;
    const res = await fetch(m.url);
    if (!res.ok) throw new Error("indirilemedi");
    blobIndir(await res.blob(), dosyaAdi(m, i));
  }, []);

  const tekIndir = useCallback(
    async (m: OdaMedya, i: number) => {
      setIndirme({ mesaj: "İndiriliyor…" });
      try {
        await tekBlobIndir(m, i);
      } catch {
        setIndirme({ mesaj: "İndirilemedi", alt: "Lütfen tekrar deneyin." });
        setTimeout(() => setIndirme(null), 2500);
        return;
      }
      setIndirme(null);
    },
    [tekBlobIndir],
  );

  // Toplu indirme: ZIP'i SUNUCU üretir, tarayıcı tek dosya indirir
  // (mobil/iOS Safari'de güvenilir; istemci belleği kullanılmaz).
  const topluIndir = useCallback(
    (medias: OdaMedya[]) => {
      const indirilecek = medias.filter((m) => m.url);
      if (indirilecek.length === 0) return;
      // Tek dosyaysa düz (ham) indir — zip'e gerek yok.
      if (indirilecek.length === 1) {
        void tekIndir(indirilecek[0], 0);
        return;
      }
      // Tüm oda mı yoksa seçim mi? Tümü ise ids boş → sunucu hepsini paketler.
      const tumu = indirilecek.length === liste.length;
      const ids = tumu ? "" : indirilecek.map((m) => m.id).join(",");
      setIndirme({
        mesaj: "Fotoğraflar hazırlanıyor…",
        alt: `${indirilecek.length} dosya · ZIP sunucuda oluşturuluyor. İndirme birazdan başlayacak (büyük galerilerde 1–2 dakika sürebilir).`,
      });
      formIleIndir("/api/oda/indir", { slug, ids });
      setTimeout(() => setIndirme(null), 6000);
    },
    [slug, liste.length, tekIndir],
  );

  function secimToggle(id: string) {
    setSecili((o) => {
      const y = new Set(o);
      if (y.has(id)) y.delete(id);
      else y.add(id);
      return y;
    });
  }

  function tumunuSec() {
    setSecili(new Set(kaynak.map((m) => m.id)));
  }
  function secimiTemizle() {
    setSecili(new Set());
  }
  function secimModuKapat() {
    setSecimModu(false);
    setSecili(new Set());
  }

  const seciliMedyalar = liste.filter((m) => secili.has(m.id));

  return (
    <div className="min-h-screen bg-background">
      {/* Üst bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-3.5 sm:px-8">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-deep">
              <Sparkles className="h-3 w-3" /> {turEtiket(bilgi.event_type)}
              {bilgi.event_date ? ` · ${tarihTR(bilgi.event_date)}` : ""}
            </p>
            <h1 className="font-display truncate text-lg font-semibold tracking-tight">
              {bilgi.title}
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setQrAcik(true)}
              title="Misafir QR kodunu paylaş"
              className="inline-flex items-center gap-2 rounded-full border border-border px-3.5 py-2 text-sm font-medium text-foreground/70 transition-colors hover:border-primary hover:text-primary"
            >
              <QrCode className="h-4 w-4" />
              <span className="hidden sm:inline">QR Paylaş</span>
            </button>
            <button
              type="button"
              onClick={yenile}
              disabled={yenileniyor}
              title="Yeni yüklemeleri getir"
              className="inline-flex items-center gap-2 rounded-full border border-border px-3.5 py-2 text-sm font-medium text-foreground/70 transition-colors hover:border-primary hover:text-primary disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${yenileniyor ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">Yenile</span>
            </button>
            <button
              type="button"
              onClick={cikisYap}
              disabled={cikis}
              className="inline-flex items-center gap-2 rounded-full border border-border px-3.5 py-2 text-sm font-medium text-foreground/70 transition-colors hover:border-primary hover:text-primary disabled:opacity-60"
            >
              {cikis ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Çıkış</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-7 sm:px-8">
        {/* İstatistik */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <Istatistik icon={Camera} deger={fotoSayi} etiket="Fotoğraf" />
          <Istatistik icon={VideoIcon} deger={videoSayi} etiket="Video" />
          <Istatistik icon={PenLine} deger={anilar.length} etiket="Anı Notu" />
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-2xl border border-primary/20 bg-primary-soft/40 px-4 py-3 text-sm text-primary-deep">
          <Star className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            <span className="font-semibold">{showroomSayi}</span> fotoğraf vitrinde
            yayında
            {bekleyenSayi > 0 && (
              <>
                {" · "}
                <span className="font-semibold">{bekleyenSayi}</span> onay bekliyor
              </>
            )}
            . Beğendiğin fotoğrafı <span className="font-medium">“Showroom’a Gönder”</span> ile
            yöneticinin onayına ilet; onaylanınca vitrinde yayınlanır.
          </p>
        </div>

        {/* Sekmeler */}
        <div className="mt-6 flex gap-1 border-b border-border">
          <SekmeDugme
            aktif={sekme === "anilar"}
            onClick={() => setSekme("anilar")}
            icon={Images}
            etiket={`Anılar (${liste.length})`}
          />
          <SekmeDugme
            aktif={sekme === "defter"}
            onClick={() => setSekme("defter")}
            icon={PenLine}
            etiket={`Anı Defteri (${anilar.length})`}
          />
        </div>

        <div className="mt-5">
          <AnimatePresence mode="wait">
            {sekme === "anilar" ? (
              <motion.div
                key="anilar"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
              >
                {liste.length === 0 ? (
                  <BosDurum
                    icon={Images}
                    baslik="Henüz içerik yok"
                    aciklama="Misafirler QR ile yükleme yaptıkça fotoğraf ve videolar burada belirir. Yeni yüklemeleri görmek için Yenile'ye dokun."
                  />
                ) : (
                  <>
                    {/* Araç çubuğu */}
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground">
                          {kaynak.length} içerik
                        </p>
                        <button
                          type="button"
                          onClick={() => setFavoriFiltre((v) => !v)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                            favoriFiltre
                              ? "bg-rose text-white"
                              : "border border-border text-foreground/70 hover:border-rose hover:text-rose"
                          }`}
                        >
                          <Heart
                            className={`h-3.5 w-3.5 ${favoriFiltre ? "fill-white" : ""}`}
                          />
                          Favoriler{favoriSayi > 0 ? ` (${favoriSayi})` : ""}
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        {!secimModu ? (
                          <>
                            <button
                              type="button"
                              onClick={() => topluIndir(kaynak)}
                              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-sm font-medium hover:border-primary hover:text-primary"
                            >
                              <Download className="h-4 w-4" /> Tümünü indir
                            </button>
                            <button
                              type="button"
                              onClick={() => setSecimModu(true)}
                              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground hover:brightness-110"
                            >
                              <CheckSquare className="h-4 w-4" /> Seç
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={
                                secili.size === kaynak.length
                                  ? secimiTemizle
                                  : tumunuSec
                              }
                              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-sm font-medium hover:border-primary hover:text-primary"
                            >
                              {secili.size === kaynak.length
                                ? "Seçimi kaldır"
                                : "Tümünü seç"}
                            </button>
                            <button
                              type="button"
                              onClick={secimModuKapat}
                              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-sm font-medium hover:border-primary hover:text-primary"
                            >
                              <X className="h-4 w-4" /> Vazgeç
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {kaynak.length === 0 && favoriFiltre && (
                      <p className="rounded-2xl bg-muted px-4 py-8 text-center text-sm text-muted-foreground">
                        Henüz favori eklemedin. Bir içeriğin kalbine dokunarak
                        favorilerine ekleyebilirsin.
                      </p>
                    )}
                    <div className="columns-2 gap-4 [column-fill:_balance] sm:columns-3 lg:columns-4">
                      {kaynak.slice(0, gosterilen).map((m, i) => (
                        <MedyaKart
                          key={m.id}
                          slug={slug}
                          medya={m}
                          secimModu={secimModu}
                          secili={secili.has(m.id)}
                          onAc={() => setLightbox(m.id)}
                          onSecim={() => secimToggle(m.id)}
                          onIndir={() => tekIndir(m, i)}
                          onSil={() => silMedya(m)}
                          onFavori={() => favoriToggle(m)}
                          onShowroom={(talep) =>
                            setListe((o) =>
                              o.map((x) =>
                                x.id === m.id
                                  ? {
                                      ...x,
                                      showroom_requested: talep,
                                      showroom_approved: talep
                                        ? x.showroom_approved
                                        : false,
                                    }
                                  : x,
                              ),
                            )
                          }
                        />
                      ))}
                    </div>
                    {gosterilen < kaynak.length && (
                      <div
                        ref={sentinelRef}
                        className="flex justify-center py-6"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setGosterilen((g) =>
                              Math.min(g + GOSTER_ADIM, kaynak.length),
                            )
                          }
                          className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium hover:border-primary hover:text-primary"
                        >
                          Daha fazla göster ({kaynak.length - gosterilen})
                        </button>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="defter"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="space-y-3"
              >
                {anilar.length === 0 ? (
                  <BosDurum
                    icon={PenLine}
                    baslik="Henüz anı notu yok"
                    aciklama="Misafirlerin bıraktığı yazılı ve sesli anılar burada toplanır."
                  />
                ) : (
                  anilar.map((a) => <AniKart key={a.id} ani={a} />)
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Seçim alt çubuğu */}
      <AnimatePresence>
        {secimModu && (
          <motion.div
            initial={{ y: 80 }}
            animate={{ y: 0 }}
            exit={{ y: 80 }}
            className="sticky bottom-0 z-30 border-t border-border bg-card/90 backdrop-blur-md"
          >
            <div
              className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 pt-3 sm:px-8"
              style={{
                paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))",
              }}
            >
              <p className="text-sm font-medium">{secili.size} seçili</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={secili.size === 0}
                  onClick={() => topluSil(seciliMedyalar)}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-elegant hover:brightness-110 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Sil
                </button>
                <button
                  type="button"
                  disabled={secili.size === 0}
                  onClick={() => topluIndir(seciliMedyalar)}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-elegant hover:brightness-110 disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                  İndir
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox */}
      <AnimatePresence>
        {(() => {
          if (lightbox === null) return null;
          const idx = kaynak.findIndex((m) => m.id === lightbox);
          if (idx < 0) return null; // görsel artık listede yok (ör. favoriden çıkarıldı)
          return (
            <Lightbox
              liste={kaynak}
              index={idx}
              onKapat={() => setLightbox(null)}
              onGit={(i) => setLightbox(kaynak[i]?.id ?? null)}
              onIndir={(m, i) => tekIndir(m, i)}
            />
          );
        })()}
      </AnimatePresence>

      {/* İndirme ilerleme overlay */}
      <AnimatePresence>
        {indirme && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm"
          >
            <div className="mx-6 max-w-xs rounded-2xl bg-card px-8 py-6 text-center shadow-elegant">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
              <p className="font-display mt-3 font-semibold">{indirme.mesaj}</p>
              {indirme.alt && (
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {indirme.alt}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Paylaş */}
      <AnimatePresence>
        {qrAcik && <QrModal slug={slug} onKapat={() => setQrAcik(false)} />}
      </AnimatePresence>
    </div>
  );
}

/* ----------------------- QR Paylaş modalı ----------------------- */
function QrModal({ slug, onKapat }: { slug: string; onKapat: () => void }) {
  const [qr, setQr] = useState("");
  const [origin, setOrigin] = useState("");
  const [kopya, setKopya] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);
  const misafirLink = origin ? `${origin}/e/${slug}` : "";

  useEffect(() => {
    if (!misafirLink) return;
    QRCode.toDataURL(misafirLink, { width: 600, margin: 2 })
      .then(setQr)
      .catch(() => setQr(""));
  }, [misafirLink]);

  async function paylas() {
    if (!misafirLink) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Anılarını paylaş",
          text: "Fotoğraf ve videolarını bu bağlantıdan yükleyebilirsin:",
          url: misafirLink,
        });
        return;
      } catch {
        /* iptal edildi */
      }
    }
    try {
      await navigator.clipboard.writeText(misafirLink);
      setKopya(true);
      setTimeout(() => setKopya(false), 1800);
    } catch {
      /* sessiz */
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onKapat}
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 px-5 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl border border-border bg-card p-7 text-center shadow-elegant"
      >
        <div className="flex items-center justify-between">
          <p className="font-display text-lg font-semibold">Misafir QR Kodu</p>
          <button
            type="button"
            onClick={onKapat}
            aria-label="Kapat"
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Misafirlerin bunu okutarak fotoğraf, video ve anı yükler.
        </p>
        <div className="mx-auto mt-5 w-fit rounded-2xl border border-border bg-white p-3">
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} alt="Misafir QR kodu" className="h-52 w-52" />
          ) : (
            <div className="flex h-52 w-52 items-center justify-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
        </div>
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={paylas}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground shadow-elegant hover:brightness-110"
          >
            <Share2 className="h-4 w-4" /> {kopya ? "Bağlantı kopyalandı" : "Paylaş"}
          </button>
          {qr && (
            <a
              href={qr}
              download={`misafir-qr-${slug}.png`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border py-3 text-sm font-medium hover:border-primary hover:text-primary"
            >
              <Download className="h-4 w-4" /> QR kodunu indir
            </a>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ----------------------- Lightbox ----------------------- */
function Lightbox({
  liste,
  index,
  onKapat,
  onGit,
  onIndir,
}: {
  liste: OdaMedya[];
  index: number;
  onKapat: () => void;
  onGit: (i: number) => void;
  onIndir: (m: OdaMedya, i: number) => void;
}) {
  const m = liste[index];
  const onceki = () => onGit((index - 1 + liste.length) % liste.length);
  const sonraki = () => onGit((index + 1) % liste.length);

  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if (e.key === "Escape") onKapat();
      else if (e.key === "ArrowLeft") onceki();
      else if (e.key === "ArrowRight") sonraki();
    };
    window.addEventListener("keydown", f);
    const eski = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", f);
      document.body.style.overflow = eski;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, liste.length]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-sm"
      onClick={onKapat}
    >
      {/* Üst bar */}
      <div
        className="flex items-center justify-between gap-3 px-4 pb-3 text-white"
        style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-sm text-white/70">
          {index + 1} / {liste.length}
          {m.guest_name ? ` · ${m.guest_name}` : ""}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onIndir(m, index)}
            className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium hover:bg-white/25"
          >
            <Download className="h-4 w-4" /> İndir
          </button>
          <button
            type="button"
            onClick={onKapat}
            aria-label="Kapat"
            className="rounded-full bg-white/15 p-2 hover:bg-white/25"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* İçerik */}
      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden px-2 pb-6"
        onClick={(e) => e.stopPropagation()}
      >
        {liste.length > 1 && (
          <button
            type="button"
            onClick={onceki}
            aria-label="Önceki"
            className="absolute left-2 z-10 rounded-full bg-white/15 p-2 text-white hover:bg-white/25 sm:left-4"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {m.url ? (
          m.file_type === "video" ? (
            <video
              src={m.url}
              controls
              autoPlay
              playsInline
              className="max-h-full max-w-full rounded-lg"
            />
          ) : (
            <motion.img
              key={index}
              src={m.url}
              alt={m.guest_name ?? "Anı"}
              drag={liste.length > 1 ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.18}
              onDragEnd={(_, info) => {
                if (info.offset.x < -80) sonraki();
                else if (info.offset.x > 80) onceki();
              }}
              initial={{ opacity: 0.4 }}
              animate={{ opacity: 1 }}
              className="max-h-full max-w-full touch-pan-y rounded-lg object-contain"
            />
          )
        ) : (
          <div className="text-white/60">Görsel yüklenemedi</div>
        )}

        {liste.length > 1 && (
          <button
            type="button"
            onClick={sonraki}
            aria-label="Sonraki"
            className="absolute right-2 z-10 rounded-full bg-white/15 p-2 text-white hover:bg-white/25 sm:right-4"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

function Istatistik({
  icon: Icon,
  deger,
  etiket,
}: {
  icon: typeof Camera;
  deger: number;
  etiket: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-sm">
      <Icon className="mx-auto h-5 w-5 text-primary" />
      <p className="font-display mt-2 text-2xl font-semibold">{deger}</p>
      <p className="text-xs text-muted-foreground">{etiket}</p>
    </div>
  );
}

function SekmeDugme({
  aktif,
  onClick,
  icon: Icon,
  etiket,
}: {
  aktif: boolean;
  onClick: () => void;
  icon: typeof Images;
  etiket: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
        aktif ? "text-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="h-4 w-4" />
      {etiket}
      {aktif && (
        <motion.span
          layoutId="musteri-sekme"
          className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary"
        />
      )}
    </button>
  );
}

function MedyaKart({
  slug,
  medya,
  secimModu,
  secili,
  onAc,
  onSecim,
  onIndir,
  onSil,
  onFavori,
  onShowroom,
}: {
  slug: string;
  medya: OdaMedya;
  secimModu: boolean;
  secili: boolean;
  onAc: () => void;
  onSecim: () => void;
  onIndir: () => void;
  onSil: () => void;
  onFavori: () => void;
  onShowroom: (talep: boolean) => void;
}) {
  const [kaydediyor, setKaydediyor] = useState(false);

  // Mevcut durum: vitrinde mi, onay bekliyor mu, hiç gönderilmemiş mi?
  const gonderildi = medya.showroom_requested || medya.showroom_approved;

  async function showroomToggle(e: React.MouseEvent) {
    e.stopPropagation();
    if (kaydediyor) return;
    const yeniTalep = !gonderildi; // gönder ↔ geri çek
    setKaydediyor(true);
    onShowroom(yeniTalep);
    try {
      const res = await fetch("/api/oda/showroom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, mediaId: medya.id, onay: yeniTalep }),
      });
      if (!res.ok) throw new Error();
    } catch {
      onShowroom(!yeniTalep);
    } finally {
      setKaydediyor(false);
    }
  }

  return (
    <div
      className={`group mb-4 break-inside-avoid overflow-hidden rounded-2xl border bg-card shadow-sm transition-all ${
        secili ? "border-primary ring-2 ring-primary" : "border-border"
      }`}
    >
      <button
        type="button"
        onClick={secimModu ? onSecim : onAc}
        className="relative block w-full bg-muted text-left"
      >
        {medya.url ? (
          medya.file_type === "video" ? (
            <video
              src={medya.url}
              playsInline
              muted
              preload="metadata"
              className="w-full"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={medya.url}
              alt={medya.guest_name ?? "Anı"}
              loading="lazy"
              className="w-full object-cover"
            />
          )
        ) : (
          <div className="flex aspect-square items-center justify-center text-muted-foreground">
            <Camera className="h-6 w-6" />
          </div>
        )}

        {medya.file_type === "video" && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur">
            <VideoIcon className="h-3 w-3" /> Video
          </span>
        )}

        {/* Seçim göstergesi */}
        {secimModu && (
          <span
            className={`absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 ${
              secili
                ? "border-primary bg-primary text-primary-foreground"
                : "border-white bg-black/30 text-transparent"
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
          </span>
        )}

        {/* Favori (her zaman görünür) + İndir (hover) */}
        {!secimModu && (
          <>
            <span
              role="button"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                onFavori();
              }}
              className={`absolute left-2 ${
                medya.file_type === "video" ? "top-9" : "top-2"
              } rounded-full p-1.5 backdrop-blur transition-colors ${
                medya.is_favorite
                  ? "bg-rose text-white"
                  : "bg-black/40 text-white hover:bg-black/60"
              }`}
              aria-label="Favori"
            >
              <Heart className={`h-4 w-4 ${medya.is_favorite ? "fill-white" : ""}`} />
            </span>
            <span
              role="button"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                onIndir();
              }}
              className="absolute right-2 top-2 hidden rounded-full bg-black/40 p-1.5 text-white backdrop-blur transition-colors hover:bg-black/60 group-hover:block"
              aria-label="İndir"
            >
              <Download className="h-4 w-4" />
            </span>
          </>
        )}
      </button>

      <div className="p-3">
        {medya.guest_name && (
          <p className="truncate text-xs text-muted-foreground">
            {medya.guest_name}
          </p>
        )}
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={showroomToggle}
            disabled={kaydediyor || secimModu}
            title={
              medya.showroom_approved
                ? "Vitrinde yayında — geri çekmek için dokun"
                : medya.showroom_requested
                  ? "Onay bekliyor — geri çekmek için dokun"
                  : "Yöneticinin onayına gönder"
            }
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
              medya.showroom_approved
                ? "bg-primary text-primary-foreground"
                : medya.showroom_requested
                  ? "bg-amber-100 text-amber-700"
                  : "border border-primary/40 text-primary-deep hover:bg-primary-soft/50"
            }`}
          >
            {kaydediyor ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : medya.showroom_approved ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : medya.showroom_requested ? (
              <Clock className="h-3.5 w-3.5" />
            ) : (
              <Star className="h-3.5 w-3.5" />
            )}
            {medya.showroom_approved
              ? "Vitrinde"
              : medya.showroom_requested
                ? "Onay bekliyor"
                : "Showroom'a Gönder"}
          </button>
          {!secimModu && (
            <button
              type="button"
              onClick={onSil}
              aria-label="Sil"
              title="Sil"
              className="shrink-0 rounded-full border border-rose/40 p-2 text-rose transition-colors hover:bg-rose/10"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function AniKart({ ani }: { ani: OdaAni }) {
  // Bazı tarayıcılar (ör. iPhone) belirli ses formatlarını satır içi çalamaz;
  // bu durumda kayda erişim kaybolmasın diye indirme bağlantısına düşeriz.
  const [calinamadi, setCalinamadi] = useState(false);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <p className="font-display font-semibold">
        {ani.guest_name ?? "İsimsiz misafir"}
      </p>
      {ani.message_text && (
        <p className="mt-2 text-sm leading-relaxed text-foreground/80">
          {ani.message_text}
        </p>
      )}
      {ani.audio_url &&
        (calinamadi ? (
          <a
            href={ani.audio_url}
            download
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-sm font-medium text-primary-deep hover:bg-primary-soft/50"
          >
            <Download className="h-4 w-4 shrink-0" />
            Sesli anıyı indir
          </a>
        ) : (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-muted px-3 py-2">
            <Mic className="h-4 w-4 shrink-0 text-primary" />
            <audio
              src={ani.audio_url}
              controls
              preload="metadata"
              onError={() => setCalinamadi(true)}
              className="h-8 w-full"
            />
          </div>
        ))}
    </div>
  );
}

function BosDurum({
  icon: Icon,
  baslik,
  aciklama,
}: {
  icon: typeof Images;
  baslik: string;
  aciklama: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card/50 p-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="font-display mt-4 text-lg font-semibold">{baslik}</h3>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
        {aciklama}
      </p>
    </div>
  );
}
