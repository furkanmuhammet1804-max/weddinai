import { notFound } from "next/navigation";
import { odaBilgiId } from "@/lib/oda/veri";
import { kategoriDurum, medyaListesi } from "@/lib/medya/veri";
import { onayTokenGetirVeyaUret } from "@/lib/kvkk/onay";
import { MedyaMerkezi } from "@/components/admin/medya-merkezi";

export const dynamic = "force-dynamic";

export default async function AdminMedyaMerkeziPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const bilgi = await odaBilgiId(id);
  if (!bilgi) notFound();

  const [durum, medyalar, token] = await Promise.all([
    kategoriDurum(id),
    medyaListesi(id),
    onayTokenGetirVeyaUret(id),
  ]);

  return (
    <MedyaMerkezi
      eventId={id}
      eventTitle={bilgi.title}
      durumIlk={durum}
      medyalar={medyalar}
      onayToken={token}
    />
  );
}
