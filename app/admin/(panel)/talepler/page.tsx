import { createAdminClient } from "@/lib/supabase/admin";
import { TaleplerListe } from "@/components/dashboard/talepler-liste";

export const dynamic = "force-dynamic";

export default async function AdminTaleplerPage() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("talepler")
    .select(
      "id, paket, customer_name, event_type, event_date, phone, email, note, durum, created_at",
    )
    .order("created_at", { ascending: false });

  return <TaleplerListe talepler={data ?? []} />;
}
