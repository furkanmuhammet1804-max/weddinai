import Link from "next/link";
import { MonitorPlay, Sparkles, Maximize2, Wifi } from "lucide-react";
import { etkinlikler } from "@/lib/mock-data";

export default function SlaytLansmanPage() {
  const aktifEtkinlikler = etkinlikler.filter((e) => e.status === "aktif");

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-2xl font-semibold tracking-tight">
        Canlı Slayt Gösterisi
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Salonun projeksiyonuna veya LED ekranına yansıtın. Misafir fotoğraf
        yüklediği an, büyük ekrana zarif animasyonla düşsün.
      </p>

      {/* Tanıtım kartı */}
      <div className="bg-aura mt-7 overflow-hidden rounded-3xl border border-border bg-card p-8 text-center shadow-elegant">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-elegant">
          <MonitorPlay className="h-8 w-8" />
        </span>
        <h2 className="font-display mt-5 text-xl font-semibold">
          Sunumu başlatmaya hazır
        </h2>
        <div className="mt-4 flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5">
            <Wifi className="h-3.5 w-3.5 text-primary" /> Gerçek zamanlı
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Yumuşak geçişler
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5">
            <Maximize2 className="h-3.5 w-3.5 text-primary" /> Tam ekran
          </span>
        </div>
      </div>

      {/* Etkinlik seçimi */}
      <h3 className="font-display mt-8 text-sm font-semibold text-muted-foreground">
        Hangi etkinlik için başlatılsın?
      </h3>
      <div className="mt-3 space-y-3">
        {aktifEtkinlikler.map((e) => (
          <div
            key={e.id}
            className="flex items-center justify-between rounded-2xl border border-border bg-card p-5"
          >
            <div>
              <p className="font-display font-semibold">{e.title}</p>
              <p className="text-xs text-muted-foreground">/slayt/{e.slug}</p>
            </div>
            <Link
              href={`/slayt/${e.slug}`}
              target="_blank"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-elegant transition-all hover:brightness-110"
            >
              <MonitorPlay className="h-4 w-4" />
              Tam Ekranı Başlat
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
