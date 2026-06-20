import { hatiraListe } from "@/lib/hatira/veri";
import { HatiraListe } from "@/components/admin/hatira-liste";

export const dynamic = "force-dynamic";

export default async function AdminHatiraPage() {
  const liste = await hatiraListe();
  return <HatiraListe liste={liste} />;
}
