import Link from "next/link";
import { Plus, DoorOpen, Lock, ArrowRight, CalendarHeart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { turEtiket, tarihTR } from "@/lib/etkinlik";

export const dynamic = "force-dynamic";

export default async function PanelPage() {
  const supabase = await createClient();
  // RLS sayesinde yalnızca bu yöneticinin odaları döner.
  const { data: odalar } = await supabase
    .from("events")
    .select(
      "id, title, customer_name, event_type, event_date, slug, status, created_at",
    )
    .order("created_at", { ascending: false });

  const liste = odalar ?? [];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Odalarım
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Her etkinlik için gizli, şifreli bir oda. Müşteriye özel link,
            misafire QR.
          </p>
        </div>
        <Link
          href="/panel/oda/yeni"
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-elegant transition-all hover:brightness-110"
        >
          <Plus className="h-4 w-4" />
          Yeni Oda
        </Link>
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
            href="/panel/oda/yeni"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-elegant transition-all hover:brightness-110"
          >
            <Plus className="h-4 w-4" /> Yeni Oda
          </Link>
        </div>
      ) : (
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {liste.map((oda) => (
            <Link
              key={oda.id as string}
              href={`/panel/oda/${oda.id}`}
              className="group flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-elegant"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft/60 px-2.5 py-1 text-xs font-medium text-primary-deep">
                  <CalendarHeart className="h-3 w-3" />
                  {turEtiket(oda.event_type as string)}
                </span>
                <DurumRozet durum={oda.status as string} />
              </div>
              <h3 className="font-display mt-3 text-lg font-semibold">
                {oda.title as string}
              </h3>
              {oda.customer_name ? (
                <p className="text-sm text-muted-foreground">
                  {oda.customer_name as string}
                </p>
              ) : null}
              <p className="mt-1 text-xs text-muted-foreground">
                {oda.event_date
                  ? tarihTR(oda.event_date as string)
                  : "Tarih belirtilmedi"}
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-sm font-medium text-primary-deep">
                <Lock className="h-3.5 w-3.5" />
                Odayı yönet
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function DurumRozet({ durum }: { durum: string }) {
  const harita: Record<string, { etiket: string; sinif: string }> = {
    aktif: { etiket: "Aktif", sinif: "bg-primary-soft text-primary-deep" },
    taslak: { etiket: "Taslak", sinif: "bg-muted text-muted-foreground" },
    arsivlendi: { etiket: "Arşiv", sinif: "bg-muted text-muted-foreground" },
  };
  const v = harita[durum] ?? harita.taslak;
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${v.sinif}`}>
      {v.etiket}
    </span>
  );
}
