import Link from "next/link";
import {
  Plus,
  QrCode,
  MonitorPlay,
  ExternalLink,
  CalendarHeart,
  MoreHorizontal,
} from "lucide-react";
import { etkinlikler, ETKINLIK_TURU_ETIKET } from "@/lib/mock-data";
import { formatTarih } from "@/lib/utils";

const durumStil: Record<string, string> = {
  aktif: "bg-emerald-50 text-emerald-700",
  taslak: "bg-muted text-muted-foreground",
  arsivlendi: "bg-rose-soft text-rose",
};
const durumEtiket: Record<string, string> = {
  aktif: "Aktif",
  taslak: "Taslak",
  arsivlendi: "Arşivlendi",
};

export default function EtkinliklerPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Etkinlikler
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {etkinlikler.length} etkinlik · tümünü buradan yönetin
          </p>
        </div>
        <Link
          href="/panel/etkinlikler/yeni"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-elegant transition-all hover:brightness-110"
        >
          <Plus className="h-4 w-4" /> Yeni Etkinlik
        </Link>
      </div>

      <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {etkinlikler.map((e) => (
          <div
            key={e.id}
            className="group overflow-hidden rounded-2xl border border-border bg-card transition-all hover:shadow-elegant"
          >
            {/* Kapak */}
            <div
              className={`relative h-32 bg-gradient-to-br ${e.cover.includes("from-") ? e.cover : "from-rose-soft to-primary-soft"}`}
            >
              <span
                className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-medium ${durumStil[e.status]}`}
              >
                {durumEtiket[e.status]}
              </span>
              <button className="absolute left-3 top-3 rounded-full bg-white/70 p-1.5 text-foreground/70 opacity-0 backdrop-blur transition-opacity hover:bg-white group-hover:opacity-100">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5">
              <h3 className="font-display text-lg font-semibold">{e.title}</h3>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarHeart className="h-3.5 w-3.5" />
                {ETKINLIK_TURU_ETIKET[e.event_type]} · {formatTarih(e.event_date)}
              </p>

              <div className="mt-4 flex gap-2">
                <Link
                  href={`/e/${e.slug}`}
                  target="_blank"
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-border py-2 text-xs font-medium hover:border-primary/40"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Misafir
                </Link>
                <Link
                  href="/panel/qr"
                  className="inline-flex items-center justify-center rounded-full border border-border p-2 hover:border-primary/40"
                  aria-label="QR"
                >
                  <QrCode className="h-4 w-4" />
                </Link>
                <Link
                  href={`/slayt/${e.slug}`}
                  target="_blank"
                  className="inline-flex items-center justify-center rounded-full border border-border p-2 hover:border-primary/40"
                  aria-label="Slayt"
                >
                  <MonitorPlay className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        ))}

        {/* Yeni etkinlik kartı */}
        <Link
          href="/panel/etkinlikler/yeni"
          className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/30 bg-card/40 text-center transition-colors hover:border-primary/60 hover:bg-primary-soft/30"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <Plus className="h-6 w-6" />
          </span>
          <p className="font-display mt-3 font-semibold">Yeni Etkinlik Oluştur</p>
          <p className="mt-1 text-xs text-muted-foreground">30 saniyede hazır</p>
        </Link>
      </div>
    </div>
  );
}
