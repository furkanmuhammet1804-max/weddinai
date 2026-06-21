import { medyaMerkeziListe } from "@/lib/medya/veri";
import { MedyaMerkeziListe } from "@/components/admin/medya-merkezi-liste";

export const dynamic = "force-dynamic";

export default async function AdminMedyaPage() {
  const liste = await medyaMerkeziListe();
  return <MedyaMerkeziListe liste={liste} />;
}
