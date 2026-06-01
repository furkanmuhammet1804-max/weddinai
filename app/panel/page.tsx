import Link from "next/link";
import {
  Images,
  Video,
  PenLine,
  Users,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  CalendarHeart,
} from "lucide-react";
import {
  panelIstatistik,
  saatlikAktivite,
  medyaListesi,
  etkinlikler,
  ETKINLIK_TURU_ETIKET,
} from "@/lib/mock-data";
import { formatTarih } from "@/lib/utils";

const istatistikKartlari = [
  {
    etiket: "Toplam Yükleme",
    deger: panelIstatistik.toplamYukleme,
    fark: "+18%",
    icon: Images,
  },
  {
    etiket: "Video",
    deger: panelIstatistik.video,
    fark: "+9%",
    icon: Video,
  },
  {
    etiket: "Anı Defteri",
    deger: panelIstatistik.aniDefteri,
    fark: "+24%",
    icon: PenLine,
  },
  {
    etiket: "Aktif Misafir",
    deger: panelIstatistik.aktifMisafir,
    fark: "+12%",
    icon: Users,
  },
];

export default function PanelPage() {
  // Boş diziye karşı koru: Math.max(...[]) => -Infinity, 0'a bölme => NaN yükseklik.
  const enYuksek = Math.max(1, ...saatlikAktivite.map((s) => s.deger));
  const oran: Record<string, string> = {
    dikey: "aspect-[3/4]",
    kare: "aspect-square",
    yatay: "aspect-[4/3]",
  };

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Genel Bakış
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {etkinlikler[0]?.title ?? "Etkinliğiniz"} · canlı etkinlik özeti
        </p>
      </div>

      {/* İstatistik kartları */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {istatistikKartlari.map((k) => {
          const Icon = k.icon;
          return (
            <div
              key={k.etiket}
              className="rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-elegant"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary-deep">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                  <TrendingUp className="h-3.5 w-3.5" />
                  {k.fark}
                </span>
              </div>
              <p className="font-display mt-4 text-3xl font-semibold">
                {k.deger}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">{k.etiket}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* Saatlik aktivite */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold">
                Saatlik Aktivite
              </h2>
              <p className="text-sm text-muted-foreground">
                Gece boyunca yükleme yoğunluğu
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" /> Bu etkinlik
            </span>
          </div>
          <div className="mt-8 flex h-48 items-end justify-between gap-3">
            {saatlikAktivite.map((s) => (
              <div
                key={s.saat}
                className="flex flex-1 flex-col items-center gap-2"
              >
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-primary/70 to-accent transition-all"
                    style={{ height: `${(s.deger / enYuksek) * 100}%` }}
                    title={`${s.deger} yükleme`}
                  />
                </div>
                <span className="text-[11px] text-muted-foreground">
                  {s.saat}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Moderasyon durumu */}
        <div className="flex flex-col rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-lg font-semibold">Moderasyon</h2>
          <p className="text-sm text-muted-foreground">Onay bekleyen içerik</p>

          <div className="mt-5 flex items-center gap-4 rounded-2xl bg-primary-soft/50 p-5">
            <span className="font-display text-4xl font-semibold text-primary-deep">
              {panelIstatistik.bekleyenOnay}
            </span>
            <div className="text-sm">
              <p className="font-medium">öğe onayınızı bekliyor</p>
              <p className="text-muted-foreground">Yayına çıkmadan inceleyin</p>
            </div>
          </div>

          <Link
            href="/panel/medya"
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-sm font-medium text-primary-foreground shadow-elegant transition-all hover:brightness-110"
          >
            İncele ve Onayla
          </Link>

          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            Moderasyon modu: Direkt Yayınla
          </div>
        </div>
      </div>

      {/* Etkinlikler + Son yüklenenler */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr]">
        {/* Etkinlik listesi */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Etkinlikler</h2>
            <Link
              href="/panel/etkinlikler"
              className="text-xs font-medium text-primary-deep hover:underline"
            >
              Tümü
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {etkinlikler.map((e) => (
              <div
                key={e.id}
                className="flex items-center gap-3 rounded-xl border border-border p-3"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary-deep">
                  <CalendarHeart className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{e.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {ETKINLIK_TURU_ETIKET[e.event_type]} ·{" "}
                    {formatTarih(e.event_date)}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                    e.status === "aktif"
                      ? "bg-emerald-50 text-emerald-700"
                      : e.status === "taslak"
                        ? "bg-muted text-muted-foreground"
                        : "bg-rose-soft text-rose"
                  }`}
                >
                  {e.status === "aktif"
                    ? "Aktif"
                    : e.status === "taslak"
                      ? "Taslak"
                      : "Arşiv"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Son yüklenen medya */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">
              Son Yüklenenler
            </h2>
            <Link
              href="/panel/medya"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary-deep hover:underline"
            >
              Medya Merkezi <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="mt-4 columns-2 gap-3 sm:columns-3">
            {medyaListesi.slice(0, 9).map((m) => (
              <div key={m.id} className="mb-3 break-inside-avoid">
                <div
                  className={`relative ${oran[m.ratio]} w-full overflow-hidden rounded-xl bg-gradient-to-br ${m.tone}`}
                >
                  {m.file_type === "video" && (
                    <span className="absolute left-2 top-2 rounded-md bg-black/30 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur">
                      Video
                    </span>
                  )}
                  {m.status === "beklemede" && (
                    <span className="absolute right-2 top-2 rounded-md bg-amber-400/90 px-1.5 py-0.5 text-[10px] font-medium text-white">
                      Beklemede
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
