"use client";

// Admin — AI Dijital Albüm oda listesi (Özellik 5). Albüm YALNIZCA buradaki
// "Oluştur" eylemiyle üretilir (otomatik değil).
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  GalleryHorizontalEnd,
  Loader2,
  Pencil,
  ExternalLink,
  Plus,
} from "lucide-react";
import { ALBUM_PAKETLER } from "@/lib/album/sabit";
import type { AlbumListeSatir } from "@/lib/album/veri";

export function AlbumListe({ liste }: { liste: AlbumListeSatir[] }) {
  const router = useRouter();
  const [paketler, setPaketler] = useState<Record<string, string>>({});
  const [calisan, setCalisan] = useState<string | null>(null);
  const [hata, setHata] = useState<string | null>(null);

  async function olustur(eventId: string) {
    if (calisan) return;
    const paket = paketler[eventId] ?? "baslangic";
    let ozelAdet: number | null = null;
    if (paket === "ozel") {
      const giris = window.prompt("Özel paket — kaç fotoğraf? (1-500)", "150");
      const n = Number(giris);
      if (!Number.isFinite(n) || n < 1) return;
      ozelAdet = Math.min(500, Math.floor(n));
    }
    setCalisan(eventId);
    setHata(null);
    try {
      const res = await fetch("/api/admin/album/olustur", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, paket, ozelAdet }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.hata ?? "Oluşturulamadı.");
      router.push(`/admin/album/${data.id}`);
    } catch (err) {
      setHata(err instanceof Error ? err.message : "Bir hata oluştu.");
      setCalisan(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary-deep">
          <GalleryHorizontalEnd className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Dijital Albüm
          </h1>
          <p className="text-sm text-muted-foreground">
            Müşterinin adaylarından siz seçip düzenleyin, bölümleyin ve yayınlayın. Son karar sizde.
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
                <th className="px-4 py-3 text-right font-medium">Aday / Foto</th>
                <th className="px-4 py-3 font-medium">Albüm</th>
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
                    <span className="font-medium text-rose">{s.aday_sayisi}</span> / {s.foto_sayisi}
                  </td>
                  <td className="px-4 py-3">
                    {s.durum === "yayinda" ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        Yayında · {s.album_foto_sayisi}
                      </span>
                    ) : s.durum === "taslak" ? (
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                        Taslak · {s.album_foto_sayisi}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {s.durum === "yayinda" && s.slug && (
                        <Link
                          href={`/album/${s.slug}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground/70 hover:border-primary hover:text-primary-deep"
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> Gör
                        </Link>
                      )}
                      {s.album_id ? (
                        <Link
                          href={`/admin/album/${s.album_id}`}
                          className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:brightness-110"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Düzenle
                        </Link>
                      ) : s.foto_sayisi > 0 ? (
                        <>
                          <select
                            value={paketler[s.event_id] ?? "baslangic"}
                            onChange={(e) =>
                              setPaketler((p) => ({ ...p, [s.event_id]: e.target.value }))
                            }
                            className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary"
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
                            onClick={() => olustur(s.event_id)}
                            disabled={calisan === s.event_id}
                            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground transition-all hover:brightness-110 disabled:opacity-60"
                          >
                            {calisan === s.event_id ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Oluşturuluyor…
                              </>
                            ) : (
                              <>
                                <Plus className="h-3.5 w-3.5" /> Oluştur
                              </>
                            )}
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">Önce fotoğraf</span>
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
