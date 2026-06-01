import { Bell, Plus } from "lucide-react";
import { Sidebar, MobilMenu } from "@/components/dashboard/sidebar";
import { ButtonLink } from "@/components/ui/button";
import { TemaSecici } from "@/components/theme/tema-secici";

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Üst bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/70 px-5 backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-3">
            <MobilMenu />
            <div>
              <p className="text-xs text-muted-foreground">Hoş geldiniz 👋</p>
              <p className="font-display text-sm font-semibold">
                Etkinlik Paneli
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <TemaSecici />
            </div>
            <button
              className="relative rounded-full border border-border p-2.5 text-foreground/70 transition-colors hover:border-primary hover:text-primary"
              aria-label="Bildirimler"
            >
              <Bell className="h-[18px] w-[18px]" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose" />
            </button>
            <ButtonLink href="/panel/oda/yeni" size="sm">
              <Plus className="h-4 w-4" />
              Yeni Oda
            </ButtonLink>
          </div>
        </header>

        <main className="flex-1 px-5 py-7 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
