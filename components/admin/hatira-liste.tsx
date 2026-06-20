"use client";

// Admin — Hatıra Defteri listesi (Özellik 3). Her oda için mesaj sayısı +
// defter durumu; AI ile taslak üretme / düzenleme / yayını görme.
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookHeart,
  Sparkles,
  Loader2,
  Pencil,
  ExternalLink,
  MessageSquare,
} from "lucide-react";
import type { HatiraListeSatir } from "@/lib/hatira/veri";

export function HatiraListe({ liste }: { liste: HatiraListeSatir[] }) {
  const router = useRouter();
  const [calisan, setCalisan] = useState<string | null>(null);
  const [hata, setHata] = useState<string | null>(null);

  async function uret(eventId: string) {
    if (calisan) return;
    setCalisan(eventId);
    setHata(null);
    try {
      const res = await fetch("/api/admin/hatira/uret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.hata ?? "Taslak üretilemedi.");
      router.push(`/admin/hatira/${data.id}`);
    } catch (err) {
      setHata(err instanceof Error ? err.message : "Bir hata oluştu.");
      setCalisan(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary-deep">
          <BookHeart className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Dijital Hatıra Defteri
          </h1>
          <p className="text-sm text-muted-foreground">
            Misafir mesajlarından AI taslağı oluşturun, düzenleyin, yayınlayın.
          </p>
        </div>
      </div>

      {hata && (
        <p className="mt-5 rounded-2xl bg-rose-soft px-4 py-3 text-sm font-medium text-rose">
          {hata}
        </p>
      )}

      <div className="mt-7 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Oda</th>
                <th className="px-4 py-3 text-right font-medium">Mesaj</th>
                <th className="px-4 py-3 font-medium">Durum</th>
                <th className="px-4 py-3 text-right font-medium">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {liste.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                    Henüz oda yok.
                  </td>
                </tr>
              )}
              {liste.map((s) => (
                <tr key={s.event_id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">{s.event_title}</p>
                    {s.customer_name && (
                      <p className="text-xs text-muted-foreground">{s.customer_name}</p>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5" /> {s.mesaj_sayisi}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {s.durum === "yayinda" ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        Yayında
                      </span>
                    ) : s.durum === "taslak" ? (
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                        Taslak
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {s.durum === "yayinda" && s.slug && (
                        <Link
                          href={`/hatira/${s.slug}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground/70 hover:border-primary hover:text-primary-deep"
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> Gör
                        </Link>
                      )}
                      {s.defter_id ? (
                        <Link
                          href={`/admin/hatira/${s.defter_id}`}
                          className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:brightness-110"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Düzenle
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => uret(s.event_id)}
                          disabled={calisan === s.event_id}
                          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground transition-all hover:brightness-110 disabled:opacity-60"
                        >
                          {calisan === s.event_id ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Üretiliyor…
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3.5 w-3.5" /> AI ile Oluştur
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
