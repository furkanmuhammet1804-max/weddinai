"use client";

// Admin — Albüm Siparişleri (F5 V2). Albüm hakkı verilmiş odalar; müşteri seçim
// durumu + tamamlanma tarihi + PDF üretimi. PDF müşterinin seçim/sıra/kapak/
// bölümlerinden üretilir (AI/otomatik seçim YOK).
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  FileDown,
  Link2,
  CheckCircle2,
  Clock,
  Truck,
  Loader2,
} from "lucide-react";
import { paketEtiket } from "@/lib/album/sabit";
import type { AlbumSiparisSatir } from "@/lib/album/veri";
import { siteLinki } from "@/lib/site";

function tarihTR(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export function AlbumSiparisListe({ liste }: { liste: AlbumSiparisSatir[] }) {
  const router = useRouter();
  const [mesaj, setMesaj] = useState<string | null>(null);
  const [calisan, setCalisan] = useState<string | null>(null);

  async function teslimEt(albumId: string, teslim: boolean) {
    if (calisan) return;
    setCalisan(albumId);
    try {
      const res = await fetch("/api/admin/album/teslim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ albumId, teslim }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.hata ?? "İşlem başarısız.");
      setMesaj(teslim ? "Albüm teslim edildi olarak işaretlendi." : "Teslim geri alındı.");
      setTimeout(() => setMesaj(null), 2500);
      router.refresh();
    } catch {
      setMesaj("İşlem başarısız.");
      setTimeout(() => setMesaj(null), 2500);
    } finally {
      setCalisan(null);
    }
  }

  function linkKopyala(token: string | null) {
    if (!token) return;
    const url = siteLinki(`/album-sec/${token}`);
    navigator.clipboard?.writeText(url).then(
      () => {
        setMesaj("Müşteri seçim linki kopyalandı.");
        setTimeout(() => setMesaj(null), 2500);
      },
      () => setMesaj(url),
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary-deep">
          <ClipboardList className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Albüm Siparişleri
          </h1>
          <p className="text-sm text-muted-foreground">
            Müşteri seçimini tamamlayınca PDF üretin. PDF müşterinin seçtiği
            fotoğraf, sıra, kapak ve bölümlerden oluşur.
          </p>
        </div>
      </div>

      {mesaj && (
        <p className="mt-5 inline-flex items-center gap-1.5 rounded-2xl bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="h-4 w-4" /> {mesaj}
        </p>
      )}

      <div className="mt-7 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Oda</th>
                <th className="px-4 py-3 font-medium">Paket</th>
                <th className="px-4 py-3 text-right font-medium">Seçilen</th>
                <th className="px-4 py-3 font-medium">Durum</th>
                <th className="px-4 py-3 text-right font-medium">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {liste.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    Henüz albüm hakkı verilmiş oda yok. Oda detayından
                    “Albüm Yetkisi Ver” ile başlayın.
                  </td>
                </tr>
              )}
              {liste.map((s) => (
                <tr key={s.album_id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">{s.event_title}</p>
                    {s.customer_name && (
                      <p className="text-xs text-muted-foreground">{s.customer_name}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {paketEtiket(s.paket)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-muted-foreground">
                    <span className="font-medium text-foreground">{s.secili_sayisi}</span> /{" "}
                    {s.limit_adet}
                  </td>
                  <td className="px-4 py-3">
                    {s.tamamlandi ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" /> {tarihTR(s.tamamlandi_at)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                        <Clock className="h-3.5 w-3.5" /> Seçim sürüyor
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => linkKopyala(s.secim_token)}
                        className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground/70 hover:border-primary hover:text-primary-deep"
                      >
                        <Link2 className="h-3.5 w-3.5" /> Link
                      </button>
                      {s.secili_sayisi > 0 ? (
                        <a
                          href={`/api/admin/album/pdf?id=${s.album_id}`}
                          className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:brightness-110"
                        >
                          <FileDown className="h-3.5 w-3.5" /> PDF Oluştur
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">Seçim yok</span>
                      )}
                      {s.tamamlandi &&
                        (s.teslim_edildi ? (
                          <button
                            type="button"
                            onClick={() => teslimEt(s.album_id, false)}
                            disabled={calisan === s.album_id}
                            className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:brightness-105 disabled:opacity-60"
                            title="Teslimi geri al"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Teslim edildi
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => teslimEt(s.album_id, true)}
                            disabled={calisan === s.album_id}
                            className="inline-flex items-center gap-1 rounded-full border border-emerald-300 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
                          >
                            {calisan === s.album_id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Truck className="h-3.5 w-3.5" />
                            )}
                            Teslim Et
                          </button>
                        ))}
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
