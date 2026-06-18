import { BarChart3, DoorOpen, Images, PenLine, Store, CheckCircle2 } from "lucide-react";
import { adminIstatistik } from "@/lib/oda/veri";

export const dynamic = "force-dynamic";

export default async function AdminIstatistikPage() {
  const ist = await adminIstatistik();

  const kartlar = [
    { icon: DoorOpen, etiket: "Toplam Oda", deger: ist.oda },
    { icon: DoorOpen, etiket: "Aktif Oda", deger: ist.aktifOda },
    { icon: Images, etiket: "Toplam Medya", deger: ist.medya },
    { icon: PenLine, etiket: "Anı Notu", deger: ist.ani },
    { icon: CheckCircle2, etiket: "Bekleyen Onay", deger: ist.bekleyenOnay },
    { icon: Store, etiket: "Vitrindeki", deger: ist.vitrindeki },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary-deep">
          <BarChart3 className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            İstatistik
          </h1>
          <p className="text-sm text-muted-foreground">
            Sistem kullanımının genel görünümü.
          </p>
        </div>
      </div>

      <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {kartlar.map((k) => {
          const Icon = k.icon;
          return (
            <div
              key={k.etiket}
              className="rounded-2xl border border-border bg-card p-5 text-center shadow-sm"
            >
              <Icon className="mx-auto h-5 w-5 text-primary" />
              <p className="font-display mt-2 text-3xl font-semibold">{k.deger}</p>
              <p className="text-xs text-muted-foreground">{k.etiket}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
