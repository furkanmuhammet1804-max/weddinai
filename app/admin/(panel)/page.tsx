import Link from "next/link";
import {
  Plus,
  DoorOpen,
  ArrowRight,
  CalendarHeart,
  Clock,
  Images,
  CheckCircle2,
} from "lucide-react";
import { adminOdalar, adminIstatistik, kalanGun } from "@/lib/oda/veri";
import { turEtiket, tarihTR } from "@/lib/etkinlik";

export const dynamic = "force-dynamic";

export default async function AdminOdalarPage() {
  const [liste, ist] = await Promise.all([adminOdalar(), adminIstatistik()]);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Odalar
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Her etkinlik için gizli, şifreli bir oda. Müşteriye özel link,
            misafire QR. Odalar 7 gün sonra otomatik silinir.
          </p>
        </div>
        <Link
          href="/admin/oda/yeni"
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-elegant transition-all hover:brightness-110"
        >
          <Plus className="h-4 w-4" />
          Yeni Oda
        </Link>
      </div>

      {/* Hızlı istatistik */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat etiket="Aktif Oda" deger={`${ist.aktifOda}/${ist.oda}`} />
        <Stat etiket="Toplam Medya" deger={ist.medya} />
        <Stat etiket="Bekleyen Onay" deger={ist.bekleyenOnay} vurgu={ist.bekleyenOnay > 0} />
        <Stat etiket="Vitrindeki" deger={ist.vitrindeki} />
      </div>

      {liste.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-border bg-card/50 p-14 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-primary">
            <DoorOpen className="h-8 w-8" />
          </div>
          <h3 className="font-display mt-5 text-xl font-semibold">
            İlk odanı oluştur
          </h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Müşterin için özel bir etkinlik odası aç; saniyeler içinde müşteri
            linki ve misafir QR&apos;ı hazır olsun.
          </p>
          <Link
            href="/admin/oda/yeni"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-elegant transition-all hover:brightness-110"
          >
            <Plus className="h-4 w-4" /> Yeni Oda
          </Link>
        </div>
      ) : (
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {liste.map((oda) => {
            const gun = kalanGun(oda.expires_at);
            return (
              <Link
                key={oda.id}
                href={`/admin/oda/${oda.id}`}
                className="group flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-elegant"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft/60 px-2.5 py-1 text-xs font-medium text-primary-deep">
                    <CalendarHeart className="h-3 w-3" />
                    {turEtiket(oda.event_type)}
                  </span>
                  <DurumRozet durum={oda.status} gun={gun} />
                </div>
                <h3 className="font-display mt-3 text-lg font-semibold">
                  {oda.title}
                </h3>
                {oda.customer_name ? (
                  <p className="text-sm text-muted-foreground">
                    {oda.customer_name}
                  </p>
                ) : null}
                <p className="mt-1 text-xs text-muted-foreground">
                  {oda.event_date ? tarihTR(oda.event_date) : "Tarih belirtilmedi"}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-muted-foreground">
                    <Images className="h-3 w-3" /> {oda.medya_sayi} medya
                  </span>
                  {oda.bekleyen_onay > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 font-medium text-amber-700">
                      <CheckCircle2 className="h-3 w-3" /> {oda.bekleyen_onay} onay
                    </span>
                  )}
                  {gun !== null && (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${
                        gun <= 2
                          ? "bg-rose/10 font-medium text-rose"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Clock className="h-3 w-3" /> {gun} gün
                    </span>
                  )}
                </div>

                <div className="mt-4 flex items-center gap-1.5 text-sm font-medium text-primary-deep">
                  Odayı yönet
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({
  etiket,
  deger,
  vurgu,
}: {
  etiket: string;
  deger: number | string;
  vurgu?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 text-center shadow-sm ${
        vurgu ? "border-amber-300 bg-amber-50" : "border-border bg-card"
      }`}
    >
      <p className="font-display text-2xl font-semibold">{deger}</p>
      <p className="text-xs text-muted-foreground">{etiket}</p>
    </div>
  );
}

function DurumRozet({ durum, gun }: { durum: string; gun: number | null }) {
  if (gun === 0) {
    return (
      <span className="rounded-full bg-rose/10 px-2.5 py-1 text-xs font-medium text-rose">
        Süresi doldu
      </span>
    );
  }
  const harita: Record<string, { etiket: string; sinif: string }> = {
    aktif: { etiket: "Aktif", sinif: "bg-emerald-100 text-emerald-700" },
    taslak: { etiket: "Taslak", sinif: "bg-muted text-muted-foreground" },
    arsivlendi: { etiket: "Pasif", sinif: "bg-muted text-muted-foreground" },
  };
  const v = harita[durum] ?? harita.taslak;
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${v.sinif}`}>
      {v.etiket}
    </span>
  );
}
