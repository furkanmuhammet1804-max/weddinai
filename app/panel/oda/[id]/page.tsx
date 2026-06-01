import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OdaDetay } from "@/components/dashboard/oda-detay";

export const dynamic = "force-dynamic";

export default async function OdaDetayPage(
  props: PageProps<"/panel/oda/[id]">,
) {
  const { id } = await props.params;
  const supabase = await createClient();

  // RLS: yalnızca sahip kendi odasını görebilir → değilse notFound.
  const { data: oda } = await supabase
    .from("events")
    .select("id, title, customer_name, event_type, event_date, slug, status")
    .eq("id", id)
    .maybeSingle();
  if (!oda) notFound();

  const [{ count: medyaSayi }, { count: aniSayi }] = await Promise.all([
    supabase
      .from("media")
      .select("id", { count: "exact", head: true })
      .eq("event_id", oda.id),
    supabase
      .from("guestbook")
      .select("id", { count: "exact", head: true })
      .eq("event_id", oda.id),
  ]);

  return (
    <OdaDetay
      oda={{
        id: oda.id as string,
        title: oda.title as string,
        customer_name: (oda.customer_name as string) ?? null,
        event_type: oda.event_type as string,
        event_date: (oda.event_date as string) ?? null,
        slug: oda.slug as string,
        status: oda.status as string,
      }}
      medyaSayi={medyaSayi ?? 0}
      aniSayi={aniSayi ?? 0}
    />
  );
}
