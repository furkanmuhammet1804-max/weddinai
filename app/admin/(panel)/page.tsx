import Link from "next/link";
import { Plus, DoorOpen } from "lucide-react";
import { adminOdalar, adminIstatistik } from "@/lib/oda/veri";
import { AdminOdaListe } from "@/components/admin/admin-oda-liste";

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
        <AdminOdaListe liste={liste} />
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
