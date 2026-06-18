import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { adminOturumGecerli } from "@/lib/admin/oturum";
import { AdminSidebar, AdminMobilMenu } from "@/components/admin/admin-sidebar";
import { ButtonLink } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Çerez imzası tam olarak burada (Node) doğrulanır.
  if (!(await adminOturumGecerli())) {
    redirect("/admin/giris");
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/70 px-5 backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-3">
            <AdminMobilMenu />
            <div>
              <p className="text-xs text-muted-foreground">Yönetici</p>
              <p className="font-display text-sm font-semibold">WeddinAI Panel</p>
            </div>
          </div>
          <ButtonLink href="/admin/oda/yeni" size="sm">
            <Plus className="h-4 w-4" />
            Yeni Oda
          </ButtonLink>
        </header>
        <main className="flex-1 px-5 py-7 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
