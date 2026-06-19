"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Inbox, Phone, Mail, Plus, MessageCircle, Loader2 } from "lucide-react";
import { turEtiket, tarihTR } from "@/lib/etkinlik";

interface Talep {
  id: string;
  paket: string;
  customer_name: string;
  event_type: string | null;
  event_date: string | null;
  phone: string | null;
  email: string | null;
  note: string | null;
  durum: string;
  created_at: string;
}

const PAKET_AD: Record<string, string> = {
  baslangic: "An",
  standart: "Anı",
  premium: "Sonsuz Anı",
};

const DURUMLAR: { deger: string; etiket: string; sinif: string }[] = [
  { deger: "yeni", etiket: "Yeni", sinif: "bg-primary-soft text-primary-deep" },
  { deger: "iletisim", etiket: "İletişimde", sinif: "bg-amber-100 text-amber-700" },
  { deger: "odendi", etiket: "Ödendi", sinif: "bg-emerald-100 text-emerald-700" },
  { deger: "tamamlandi", etiket: "Tamamlandı", sinif: "bg-emerald-100 text-emerald-700" },
  { deger: "iptal", etiket: "İptal", sinif: "bg-muted text-muted-foreground" },
];

function waLink(phone: string): string {
  const temiz = phone.replace(/[^0-9]/g, "");
  const tam = temiz.startsWith("0") ? "9" + temiz : temiz;
  return `https://wa.me/${tam}`;
}

export function TaleplerListe({ talepler }: { talepler: Talep[] }) {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Talepler
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Fiyatlar sayfasından gelen sipariş talepleri. Ara, ödemeyi al,
            odasını oluştur.
          </p>
        </div>
        <Link
          href="/admin/oda/yeni"
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-elegant hover:brightness-110"
        >
          <Plus className="h-4 w-4" /> Yeni Oda
        </Link>
      </div>

      {talepler.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-border bg-card/50 p-14 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Inbox className="h-8 w-8" />
          </div>
          <h3 className="font-display mt-5 text-xl font-semibold">
            Henüz talep yok
          </h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Fiyatlar sayfasından bir çift &quot;Hemen Başla&quot; dediğinde
            talebi burada görürsün.
          </p>
        </div>
      ) : (
        <div className="mt-7 space-y-3">
          {talepler.map((t) => (
            <TalepKart key={t.id} talep={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function TalepKart({ talep }: { talep: Talep }) {
  const router = useRouter();
  const [durum, setDurum] = useState(talep.durum);
  const [kaydediyor, setKaydediyor] = useState(false);

  async function durumDegistir(yeni: string) {
    if (kaydediyor || yeni === durum) return;
    const eski = durum;
    setDurum(yeni);
    setKaydediyor(true);
    try {
      const res = await fetch("/api/admin/talep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: talep.id, durum: yeni }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setDurum(eski);
    } finally {
      setKaydediyor(false);
    }
  }

  const rozet =
    DURUMLAR.find((d) => d.deger === durum) ?? DURUMLAR[0];

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-lg font-semibold">
              {talep.customer_name}
            </h3>
            <span className="rounded-full bg-primary-soft/60 px-2.5 py-0.5 text-xs font-medium text-primary-deep">
              {PAKET_AD[talep.paket] ?? talep.paket}
            </span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${rozet.sinif}`}>
              {rozet.etiket}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {talep.event_type ? turEtiket(talep.event_type) : "Etkinlik"}
            {talep.event_date ? ` · ${tarihTR(talep.event_date)}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {kaydediyor && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          <select
            value={durum}
            onChange={(e) => durumDegistir(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          >
            {DURUMLAR.map((d) => (
              <option key={d.deger} value={d.deger}>
                {d.etiket}
              </option>
            ))}
          </select>
        </div>
      </div>

      {talep.note && (
        <p className="mt-3 rounded-xl bg-muted/60 px-3 py-2 text-sm text-foreground/80">
          {talep.note}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {talep.phone && (
          <>
            <a
              href={`tel:${talep.phone}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-sm font-medium hover:border-primary hover:text-primary"
            >
              <Phone className="h-3.5 w-3.5" /> {talep.phone}
            </a>
            <a
              href={waLink(talep.phone)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 px-3.5 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
            >
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
            </a>
          </>
        )}
        {talep.email && (
          <a
            href={`mailto:${talep.email}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-sm font-medium hover:border-primary hover:text-primary"
          >
            <Mail className="h-3.5 w-3.5" /> {talep.email}
          </a>
        )}
        <Link
          href="/admin/oda/yeni"
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground hover:brightness-110"
        >
          <Plus className="h-3.5 w-3.5" /> Oda Oluştur
        </Link>
      </div>
    </div>
  );
}
