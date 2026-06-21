"use client";

// Admin — AI Medya Merkezi oda listesi (Özellik 4 revizyonu).
// Lokal kategori (tekli/toplu/video) + KVKK onay durumu (✅/❌).
import Link from "next/link";
import { Images, ShieldCheck, ShieldAlert, ArrowRight } from "lucide-react";
import type { MedyaMerkeziSatir } from "@/lib/medya/veri";

export function MedyaMerkeziListe({ liste }: { liste: MedyaMerkeziSatir[] }) {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary-deep">
          <Images className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Medya Merkezi
          </h1>
          <p className="text-sm text-muted-foreground">
            Fotoğraflar yüklenir yüklenmez tekli / toplu / video olarak otomatik ayrılır.
          </p>
        </div>
      </div>

      <div className="mt-7 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Oda</th>
                <th className="px-4 py-3 text-right font-medium">Medya</th>
                <th className="px-4 py-3 text-right font-medium">Kategorilenen</th>
                <th className="px-4 py-3 font-medium">KVKK Onayı</th>
                <th className="px-4 py-3 text-right font-medium">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {liste.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
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
                    {s.toplam}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-muted-foreground">
                    {s.kategorilenen}/{s.toplam}
                    {s.bekleyen > 0 && (
                      <span className="ml-1 text-amber-600">· {s.bekleyen} bekliyor</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {s.ai_medya_onay ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        <ShieldCheck className="h-3.5 w-3.5" /> ✅ Onaylandı
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                        <ShieldAlert className="h-3.5 w-3.5" /> ❌ Onay Bekleniyor
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <Link
                      href={`/admin/medya/${s.event_id}`}
                      className="inline-flex items-center gap-1 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground hover:brightness-110"
                    >
                      Aç <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
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
