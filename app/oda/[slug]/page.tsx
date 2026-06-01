import { notFound } from "next/navigation";
import { odaOturumOku } from "@/lib/oda/oturum";
import { odaBilgiId, odaMedyalari, odaAnilari } from "@/lib/oda/veri";
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
  const [medyalar, anilar] = await Promise.all([
    odaMedyalari(eventId),
    odaAnilari(eventId),
  ]);

  return (
    <MusteriPanel
      slug={temiz}
      bilgi={bilgi}
      medyalar={medyalar}
      anilar={anilar}
    />
  );
}
