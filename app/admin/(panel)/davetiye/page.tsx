import { davetiyeListe } from "@/lib/davetiye";
import { DavetiyeListe } from "@/components/admin/davetiye-liste";

export const dynamic = "force-dynamic";

export default async function AdminDavetiyePage() {
  const davetiyeler = await davetiyeListe();
  return <DavetiyeListe davetiyeler={davetiyeler} />;
}
