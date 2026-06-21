import { notFound } from "next/navigation";
import { odaBilgiId } from "@/lib/oda/veri";
import { analizDurum, analizListesi } from "@/lib/medya/veri";
import { MedyaMerkezi } from "@/components/admin/medya-merkezi";

export const dynamic = "force-dynamic";

export default async function AdminMedyaMerkeziPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const bilgi = await odaBilgiId(id);
  if (!bilgi) notFound();

  const [durum, fotolar] = await Promise.all([
    analizDurum(id),
    analizListesi(id),
  ]);

  return (
    <MedyaMerkezi
      eventId={id}
      eventTitle={bilgi.title}
      durumIlk={durum}
      fotolar={fotolar}
    />
  );
}
