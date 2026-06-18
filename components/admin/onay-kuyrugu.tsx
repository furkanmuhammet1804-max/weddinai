"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  X,
  Loader2,
  Video as VideoIcon,
  Store,
} from "lucide-react";
import type { OnayBekleyen } from "@/lib/oda/veri";

export function OnayKuyrugu({ baslangic }: { baslangic: OnayBekleyen[] }) {
  const [liste, setListe] = useState<OnayBekleyen[]>(baslangic);
  const [bekle, setBekle] = useState<string | null>(null);

  async function karar(m: OnayBekleyen, onay: boolean) {
    if (bekle) return;
    setBekle(m.id);
    try {
      const res = await fetch("/api/admin/onay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaId: m.id, onay }),
      });
      if (!res.ok) throw new Error();
      setListe((o) => o.filter((x) => x.id !== m.id));
    } catch {
      window.alert("İşlem başarısız. Tekrar deneyin.");
    } finally {
      setBekle(null);
    }
  }

  if (liste.length === 0) {
    return (
      <div className="mx-auto max-w-4xl">
        <Baslik adet={0} />
        <div className="mt-8 rounded-3xl border border-dashed border-border bg-card/50 p-14 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-primary">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h3 className="font-display mt-5 text-xl font-semibold">
            Bekleyen onay yok
          </h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Müşteriler vitrine fotoğraf gönderdikçe burada onayına düşer.
            Onayladıkların showroomda yayınlanır.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Baslik adet={liste.length} />
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {liste.map((m) => (
          <div
            key={m.id}
            className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
          >
            <div className="relative aspect-square bg-muted">
              {m.url ? (
                m.file_type === "video" ? (
                  <video src={m.url} muted playsInline className="h-full w-full object-cover" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.url} alt="" loading="lazy" className="h-full w-full object-cover" />
                )
              ) : null}
              {m.file_type === "video" && (
                <span className="absolute left-2 top-2 rounded-full bg-black/40 px-1.5 py-0.5 text-[10px] text-white">
                  <VideoIcon className="inline h-3 w-3" /> Video
                </span>
              )}
            </div>
            <div className="flex flex-1 flex-col p-3">
              <Link
                href={`/admin/oda/${m.event_id}`}
                className="truncate text-xs font-medium text-primary-deep hover:underline"
              >
                {m.event_title}
              </Link>
              {m.guest_name && (
                <p className="truncate text-xs text-muted-foreground">{m.guest_name}</p>
              )}
              <div className="mt-2 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => karar(m, true)}
                  disabled={!!bekle}
                  className="inline-flex flex-1 items-center justify-center gap-1 rounded-full bg-primary px-2 py-1.5 text-xs font-medium text-primary-foreground hover:brightness-110 disabled:opacity-50"
                >
                  {bekle === m.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  Onayla
                </button>
                <button
                  type="button"
                  onClick={() => karar(m, false)}
                  disabled={!!bekle}
                  aria-label="Reddet"
                  className="inline-flex shrink-0 items-center justify-center rounded-full border border-border p-1.5 text-muted-foreground hover:border-rose hover:text-rose disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Baslik({ adet }: { adet: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary-deep">
        <Store className="h-5 w-5" />
      </span>
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Showroom Onayları
        </h1>
        <p className="text-sm text-muted-foreground">
          {adet > 0
            ? `${adet} içerik vitrin onayını bekliyor.`
            : "Müşterilerin vitrine gönderdiği içerikleri buradan onaylarsın."}
        </p>
      </div>
    </div>
  );
}
