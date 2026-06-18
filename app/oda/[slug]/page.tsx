import { notFound } from "next/navigation";
import Link from "next/link";
import { Lock } from "lucide-react";
import { odaOturumOku } from "@/lib/oda/oturum";
import { odaBilgiId, odaMedyalari, odaAnilari, odaAcikMi } from "@/lib/oda/veri";
import { createAdminClient } from "@/lib/supabase/admin";
import { OdaGiris } from "@/components/musteri/oda-giris";
import { MusteriPanel } from "@/components/musteri/musteri-panel";

// Müşteri paneli her zaman istek anında render edilir (oturum çerezine bağlı).
export const dynamic = "force-dynamic";

export default async function OdaPage(props: PageProps<"/oda/[slug]">) {
  const { slug } = await props.params;
  const temiz = typeof slug === "string" ? slug.trim() : "";
  if (!temiz) notFound();

  // Oda var mı? (yoksa 404) — başlığı şifre kapısında göstermek için çek.
  const admin = createAdminClient();
  const { data: ev } = await admin
    .from("events")
    .select("id, title")
    .ilike("slug", temiz)
    .maybeSingle();
  if (!ev) notFound();

  // Oturum yoksa → şifre kapısı.
  const eventId = await odaOturumOku(temiz);
  if (!eventId || eventId !== ev.id) {
    return <OdaGiris slug={temiz} baslik={ev.title as string} />;
  }

  // Oturum var → odanın içeriğini getir.
  const bilgi = await odaBilgiId(eventId);
  if (!bilgi) {
    return <OdaGiris slug={temiz} baslik={ev.title as string} />;
  }

  // Oda pasif veya süresi dolmuşsa erişim kapalı.
  if (!odaAcikMi(bilgi)) {
    return <OdaKapali baslik={bilgi.title} />;
  }

  const [medyalar, anilar] = await Promise.all([
    odaMedyalari(eventId),
    odaAnilari(eventId),
  ]);

  return (
    <MusteriPanel slug={temiz} bilgi={bilgi} medyalar={medyalar} anilar={anilar} />
  );
}

function OdaKapali({ baslik }: { baslik: string }) {
  return (
    <div className="bg-aura flex min-h-screen items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm rounded-3xl border border-border bg-card/80 p-8 text-center shadow-elegant backdrop-blur">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <Lock className="h-7 w-7" />
        </span>
        <h1 className="font-display mt-5 text-2xl font-semibold tracking-tight">
          {baslik}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Bu odanın erişimi kapatıldı. Gizlilik gereği etkinlik odaları belirli
          bir süre sonra otomatik kapanır. Sorunuz varsa yöneticinizle iletişime
          geçebilirsiniz.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-full border border-border px-5 py-2.5 text-sm font-medium hover:border-primary hover:text-primary"
        >
          Ana sayfaya dön
        </Link>
      </div>
    </div>
  );
}
