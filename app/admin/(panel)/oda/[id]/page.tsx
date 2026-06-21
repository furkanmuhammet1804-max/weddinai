import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { odaMedyalari, odaAnilari } from "@/lib/oda/veri";
import { onayTokenGetirVeyaUret } from "@/lib/kvkk/onay";
import { AdminOdaDetay } from "@/components/admin/admin-oda-detay";

export const dynamic = "force-dynamic";

export default async function AdminOdaDetayPage(
  props: PageProps<"/admin/oda/[id]">,
) {
  const { id } = await props.params;
  const admin = createAdminClient();

  const { data: oda } = await admin
    .from("events")
    .select(
      "id, title, customer_name, event_type, event_date, slug, status, expires_at",
    )
    .eq("id", id)
    .maybeSingle();
  if (!oda) notFound();

  // KVKK AI onay token'ı: idempotent — yoksa üretir, varsa getirir. Böylece
  // onay linki oda detayda her zaman gösterilir (mevcut odalar dahil).
  const [medyalar, anilar, onayToken] = await Promise.all([
    odaMedyalari(oda.id as string),
    odaAnilari(oda.id as string),
    onayTokenGetirVeyaUret(oda.id as string),
  ]);

  return (
    <AdminOdaDetay
      oda={{
        id: oda.id as string,
        title: oda.title as string,
        customer_name: (oda.customer_name as string) ?? null,
        event_type: oda.event_type as string,
        event_date: (oda.event_date as string) ?? null,
        slug: oda.slug as string,
        status: oda.status as string,
        expires_at: (oda.expires_at as string) ?? null,
      }}
      medyalar={medyalar}
      anilar={anilar}
      onayToken={onayToken}
    />
  );
}
