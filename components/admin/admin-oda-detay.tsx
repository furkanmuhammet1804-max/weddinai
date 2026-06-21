"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { formIleIndir } from "@/lib/indir";
import { kopyalaVeBildir } from "@/lib/pano";
import {
  ArrowLeft,
  Copy,
  Check,
  Lock,
  QrCode,
  ExternalLink,
  Download,
  Images,
  PenLine,
  Loader2,
  Eye,
  EyeOff,
  Store,
  MonitorPlay,
  Trash2,
  AlertTriangle,
  Power,
  Clock,
  Mic,
  Video as VideoIcon,
  Camera,
  ShieldCheck,
} from "lucide-react";
import { turEtiket, tarihTR } from "@/lib/etkinlik";
import { ALBUM_PAKETLER } from "@/lib/album/sabit";
import type { OdaMedya, OdaAni } from "@/lib/oda/veri";

interface Oda {
  id: string;
  title: string;
  customer_name: string | null;
  event_type: string;
  event_date: string | null;
  slug: string;
  status: string;
  expires_at: string | null;
}

function kalanGun(expires_at: string | null): number | null {
  if (!expires_at) return null;
  const ms = new Date(expires_at).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export function AdminOdaDetay({
  oda,
  medyalar,
  anilar,
  onayToken,
}: {
  oda: Oda;
  medyalar: OdaMedya[];
  anilar: OdaAni[];
  onayToken: string | null;
}) {
  const router = useRouter();
  const [origin, setOrigin] = useState("");
  const [qr, setQr] = useState("");

  useEffect(() => {
    // Tarayıcı-yalnız okuma; SSR'de window yok, mount sonrası kasıtlı.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrigin(window.location.origin);
  }, []);

  const musteriLink = origin ? `${origin}/oda/${oda.slug}` : "";
  const misafirLink = origin ? `${origin}/e/${oda.slug}` : "";
  const showroomLink = origin ? `${origin}/showroom/${oda.slug}` : "";
  const slaytLink = origin ? `${origin}/slayt/${oda.slug}` : "";
  const aiOnayLink = origin && onayToken ? `${origin}/ai-onay/${onayToken}` : "";

  useEffect(() => {
    if (!misafirLink) return;
    QRCode.toDataURL(misafirLink, { width: 520, margin: 2 })
      .then(setQr)
      .catch(() => setQr(""));
  }, [misafirLink]);

  const gun = kalanGun(oda.expires_at);
  const aktif = oda.status === "aktif";

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Odalar
      </Link>

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
        <Mini icon={Images} deger={medyalar.length} etiket="Medya" />
        <Mini icon={PenLine} deger={anilar.length} etiket="Anı Notu" />
        <Mini
          icon={Clock}
          deger={gun === null ? "∞" : `${gun} gün`}
          etiket="Kalan süre"
        />
      </div>

      {/* Durum yönetimi */}
      <DurumBolum oda={oda} aktif={aktif} gun={gun} />

      {/* Müşteri linki */}
      <Bolum
        baslik="Müşteri Girişi"
        aciklama="Müşteri, siteden 'Müşteri Girişi'ne girip aşağıdaki oda kodu + şifre ile girer. Ya da doğrudan linki açabilir."
        icon={Lock}
      >
        <div className="mb-3 rounded-xl border border-primary/30 bg-primary-soft/40 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-primary-deep">
            Oda Kodu (kullanıcı adı)
          </p>
          <p className="font-display mt-0.5 text-lg font-semibold tracking-tight">
            {oda.slug}
          </p>
        </div>
        <LinkSatiri link={musteriLink} />
        <div className="mt-3">
          <Ac link={musteriLink} etiket="Müşteri panelini aç" />
        </div>
      </Bolum>

      {/* KVKK — AI medya onay linki (müşteriye gönderilir) */}
      <Bolum
        baslik="KVKK — AI Medya Onay Linki"
        aciklama="Bu linki müşteriye gönder. Müşteri onay verince fotoğraflar tekli/toplu otomatik ayrılabilir (yüz sayımı sunucuda lokal yapılır; hiçbir yere gönderilmez). Onay olmadan fotoğraflar kategorilenmez."
        icon={ShieldCheck}
      >
        {onayToken ? (
          <>
            <LinkSatiri link={aiOnayLink} />
            <div className="mt-3">
              <Ac link={aiOnayLink} etiket="Onay sayfasını aç" />
            </div>
          </>
        ) : (
          <p className="text-sm text-amber-600">
            Onay linki üretilemedi. Sayfayı yenileyin; sorun sürerse Medya
            Merkezi&apos;nden tekrar deneyin.
          </p>
        )}
      </Bolum>

      {/* Albüm yetkisi (müşteri seçim linki) */}
      <Bolum
        baslik="Albüm Hazırlama Yetkisi"
        aciklama="Albüm hizmeti alan müşteriye paket ver; müşteri kendi fotoğraflarını seçip sıralasın, kapak ve bölüm belirlesin. Albümü siz üretirsiniz (Albüm Siparişleri)."
        icon={Images}
      >
        <AlbumHakkiBolum odaId={oda.id} />
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

      {/* Showroom + Slayt */}
      <Bolum
        baslik="Showroom (Vitrin)"
        aciklama="Senin onayladığın fotoğraflar bu herkese açık vitrinde görünür. Onay kuyruğu 'Showroom Onayları' sekmesinde."
        icon={Store}
      >
        <LinkSatiri link={showroomLink} />
        <div className="mt-3">
          <Ac link={showroomLink} etiket="Vitrini aç" />
        </div>
      </Bolum>

      <Bolum
        baslik="Canlı Slayt (Etkinlik Ekranı)"
        aciklama="Salondaki ekrana/projeksiyona bu linki aç. Misafirler yükledikçe fotoğraflar canlı akar."
        icon={MonitorPlay}
      >
        <LinkSatiri link={slaytLink} />
        <div className="mt-3">
          <Ac link={slaytLink} etiket="Slaytı başlat" />
        </div>
      </Bolum>

      {/* İçerik */}
      <IcerikBolum medyalar={medyalar} anilar={anilar} slug={oda.slug} />

      {/* Şifre */}
      <SifreBolum odaId={oda.id} />

      {/* Tehlikeli bölge */}
      <OdaSilBolum odaId={oda.id} baslik={oda.title} onSilindi={() => router.push("/admin")} />
    </div>
  );
}

function DurumBolum({
  oda,
  aktif,
  gun,
}: {
  oda: Oda;
  aktif: boolean;
  gun: number | null;
}) {
  const router = useRouter();
  const [bekle, setBekle] = useState<string | null>(null);

  async function islem(islemTuru: "aktif" | "pasif" | "uzat") {
    if (bekle) return;
    setBekle(islemTuru);
    try {
      const res = await fetch("/api/admin/oda-durum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: oda.id, islem: islemTuru, gun: 7 }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      window.alert("İşlem başarısız. Tekrar deneyin.");
    } finally {
      setBekle(null);
    }
  }

  return (
    <section className="mt-5 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
            aktif ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
          }`}
        >
          <Power className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display font-semibold">
            Oda {aktif ? "Aktif" : "Pasif"}
            {gun === 0 && " · Süresi doldu"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {aktif
              ? "Müşteri girişi, misafir yükleme ve vitrin açık."
              : "Erişim kapalı. Müşteri ve misafir bu odaya giremez."}
            {gun !== null && ` Kalan süre: ${gun} gün.`}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => islem(aktif ? "pasif" : "aktif")}
          disabled={!!bekle}
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:border-primary hover:text-primary disabled:opacity-60"
        >
          {bekle === "aktif" || bekle === "pasif" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Power className="h-4 w-4" />
          )}
          {aktif ? "Pasife al" : "Aktif yap"}
        </button>
        <button
          type="button"
          onClick={() => islem("uzat")}
          disabled={!!bekle}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:brightness-110 disabled:opacity-60"
        >
          {bekle === "uzat" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Clock className="h-4 w-4" />
          )}
          Süreyi 7 gün uzat
        </button>
      </div>
    </section>
  );
}

function IcerikBolum({
  medyalar,
  anilar,
  slug,
}: {
  medyalar: OdaMedya[];
  anilar: OdaAni[];
  slug: string;
}) {
  const [indirme, setIndirme] = useState<{ mesaj: string; alt?: string } | null>(
    null,
  );

  // ZIP'i SUNUCU üretir (admin rotası), tarayıcı tek dosya indirir.
  const topluIndir = useCallback(() => {
    const adet = medyalar.filter((m) => m.url).length;
    if (adet === 0) return;
    setIndirme({
      mesaj: "Medya hazırlanıyor…",
      alt: `${adet} dosya · ZIP sunucuda oluşturuluyor. İndirme birazdan başlayacak.`,
    });
    formIleIndir("/api/admin/indir", { slug });
    setTimeout(() => setIndirme(null), 6000);
  }, [medyalar, slug]);

  return (
    <section className="mt-5 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-deep">
          <Images className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display font-semibold">Oda İçeriği</h2>
          <p className="text-sm text-muted-foreground">
            {medyalar.length} medya · {anilar.length} anı notu. Buradan görüntüle
            ve indir.
          </p>
        </div>
        {medyalar.length > 0 && (
          <button
            type="button"
            onClick={topluIndir}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground hover:brightness-110"
          >
            <Download className="h-4 w-4" /> Tümünü indir
          </button>
        )}
      </div>

      {medyalar.length === 0 ? (
        <p className="mt-4 rounded-xl bg-muted px-4 py-6 text-center text-sm text-muted-foreground">
          Henüz yüklenmiş medya yok.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {medyalar.map((m) => (
            <a
              key={m.id}
              href={m.url ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block aspect-square overflow-hidden rounded-xl border border-border bg-muted"
            >
              {m.url ? (
                m.file_type === "video" ? (
                  <video src={m.url} muted playsInline className="h-full w-full object-cover" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.url} alt="" loading="lazy" className="h-full w-full object-cover" />
                )
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <Camera className="h-5 w-5" />
                </div>
              )}
              {m.file_type === "video" && (
                <span className="absolute left-1.5 top-1.5 rounded-full bg-black/40 px-1.5 py-0.5 text-[10px] text-white">
                  <VideoIcon className="inline h-3 w-3" />
                </span>
              )}
              {m.showroom_approved && (
                <span className="absolute right-1.5 top-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                  Vitrin
                </span>
              )}
            </a>
          ))}
        </div>
      )}

      {anilar.length > 0 && (
        <div className="mt-5 space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Anı Defteri
          </p>
          {anilar.map((a) => (
            <div key={a.id} className="rounded-xl border border-border bg-background p-3">
              <p className="text-sm font-medium">{a.guest_name ?? "İsimsiz misafir"}</p>
              {a.message_text && (
                <p className="mt-1 text-sm text-foreground/80">{a.message_text}</p>
              )}
              {a.audio_url && <AniSes url={a.audio_url} />}
            </div>
          ))}
        </div>
      )}

      {indirme && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm">
          <div className="mx-6 max-w-xs rounded-2xl bg-card px-8 py-6 text-center shadow-elegant">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="font-display mt-3 font-semibold">{indirme.mesaj}</p>
            {indirme.alt && (
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {indirme.alt}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

// Sesli anı oynatıcı; tarayıcı formatı satır içi çalamazsa indirmeye düşer.
function AniSes({ url }: { url: string }) {
  const [calinamadi, setCalinamadi] = useState(false);
  if (calinamadi) {
    return (
      <a
        href={url}
        download
        className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
      >
        <Download className="h-4 w-4 shrink-0" />
        Sesli anıyı indir
      </a>
    );
  }
  return (
    <div className="mt-2 flex items-center gap-2">
      <Mic className="h-4 w-4 shrink-0 text-primary" />
      <audio
        src={url}
        controls
        preload="metadata"
        onError={() => setCalinamadi(true)}
        className="h-8 w-full"
      />
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
    const ok = await kopyalaVeBildir(link);
    if (ok) {
      setKopya(true);
      setTimeout(() => setKopya(false), 1800);
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

// Admin: odaya albüm hakkı verir (paket seç → token üret → müşteri seçim linki).
function AlbumHakkiBolum({ odaId }: { odaId: string }) {
  const [paket, setPaket] = useState<string>("baslangic");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [hata, setHata] = useState<string | null>(null);

  async function hakVer() {
    if (yukleniyor) return;
    let ozelAdet: number | null = null;
    if (paket === "ozel") {
      const giris = window.prompt("Özel paket — kaç fotoğraf? (1-500)", "150");
      const n = Number(giris);
      if (!Number.isFinite(n) || n < 1) return;
      ozelAdet = Math.min(500, Math.floor(n));
    }
    setYukleniyor(true);
    setHata(null);
    try {
      const res = await fetch("/api/admin/album/hak-ver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: odaId, paket, ozelAdet }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok || !data.token)
        throw new Error(data.hata ?? "İşlem başarısız.");
      setLink(`${window.location.origin}/album-sec/${data.token}`);
    } catch (err) {
      setHata(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setYukleniyor(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={paket}
          onChange={(e) => setPaket(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        >
          {ALBUM_PAKETLER.map((p) => (
            <option key={p.deger} value={p.deger}>
              {p.etiket}
              {p.adet ? ` (${p.adet})` : ""}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={hakVer}
          disabled={yukleniyor}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 disabled:opacity-60"
        >
          {yukleniyor ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Images className="h-4 w-4" />
          )}
          Albüm Yetkisi Ver
        </button>
      </div>

      {hata && (
        <p className="mt-3 rounded-xl bg-rose-soft px-4 py-2.5 text-sm font-medium text-rose">
          {hata}
        </p>
      )}

      {link && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium text-emerald-700">
            Albüm seçim linki hazır — müşteriye gönderin:
          </p>
          <LinkSatiri link={link} />
          <div className="mt-3">
            <Ac link={link} etiket="Seçim ekranını aç" />
          </div>
        </div>
      )}
    </div>
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
      const res = await fetch("/api/admin/oda/sifre", {
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

function OdaSilBolum({
  odaId,
  baslik,
  onSilindi,
}: {
  odaId: string;
  baslik: string;
  onSilindi: () => void;
}) {
  const [siliniyor, setSiliniyor] = useState(false);

  async function sil() {
    if (siliniyor) return;
    const onay = window.prompt(
      `"${baslik}" odasını ve TÜM fotoğraf/video/anılarını kalıcı olarak silmek üzeresiniz. Bu işlem geri ALINAMAZ.\n\nOnaylamak için SİL yazın:`,
    );
    if ((onay ?? "").trim().toLocaleUpperCase("tr") !== "SİL") return;
    setSiliniyor(true);
    try {
      const res = await fetch("/api/admin/oda-sil", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: odaId }),
      });
      if (!res.ok) throw new Error();
      onSilindi();
    } catch {
      setSiliniyor(false);
      window.alert("Oda silinemedi. Lütfen tekrar deneyin.");
    }
  }

  return (
    <section className="mt-5 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white">
          <AlertTriangle className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display font-semibold text-red-600">Tehlikeli Bölge</h2>
          <p className="text-sm text-muted-foreground">
            Odayı silmek; tüm fotoğraf, video ve anıları kalıcı olarak kaldırır.
            Geri alınamaz.
          </p>
          <button
            type="button"
            onClick={sil}
            disabled={siliniyor}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-red-700 disabled:opacity-60"
          >
            {siliniyor ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Odayı Sil
          </button>
        </div>
      </div>
    </section>
  );
}
