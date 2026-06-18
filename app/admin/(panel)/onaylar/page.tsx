import { onayKuyrugu } from "@/lib/oda/veri";
import { OnayKuyrugu } from "@/components/admin/onay-kuyrugu";

export const dynamic = "force-dynamic";

export default async function AdminOnaylarPage() {
  const kuyruk = await onayKuyrugu();
  return <OnayKuyrugu baslangic={kuyruk} />;
}
