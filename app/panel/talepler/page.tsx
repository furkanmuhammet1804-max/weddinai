import { createClient } from "@/lib/supabase/server";
import { TaleplerListe } from "@/components/dashboard/talepler-liste";

export const dynamic = "force-dynamic";

export default async function TaleplerPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("talepler")
    .select(
      "id, paket, customer_name, event_type, event_date, phone, email, note, durum, created_at",
    )
    .order("created_at", { ascending: false });

  return <TaleplerListe talepler={data ?? []} />;
}
