import { redirect } from "next/navigation";
import { adminOturumGecerli } from "@/lib/admin/oturum";
import { AdminGiris } from "@/components/admin/admin-giris";

export const dynamic = "force-dynamic";

export default async function AdminGirisPage() {
  // Zaten girişliyse panele al.
  if (await adminOturumGecerli()) redirect("/admin");
  return <AdminGiris />;
}
