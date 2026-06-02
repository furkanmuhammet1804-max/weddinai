"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DoorOpen,
  Plus,
  Inbox,
  Settings,
  Menu,
  X,
  LogOut,
  Loader2,
} from "lucide-react";
import { Logo } from "@/components/site/logo";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const menu = [
  { href: "/panel", label: "Odalarım", icon: DoorOpen },
  { href: "/panel/oda/yeni", label: "Yeni Oda", icon: Plus },
  { href: "/panel/talepler", label: "Talepler", icon: Inbox },
  { href: "/panel/ayarlar", label: "Ayarlar", icon: Settings },
];

function NavIcerik({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {menu.map((m) => {
          const Icon = m.icon;
          const aktif =
            m.href === "/panel"
              ? pathname === "/panel" ||
                (pathname.startsWith("/panel/oda/") &&
                  pathname !== "/panel/oda/yeni")
              : m.href === "/panel/oda/yeni"
                ? pathname === "/panel/oda/yeni"
                : pathname.startsWith(m.href);
          return (
            <Link
              key={m.href}
              href={m.href}
              onClick={onNavigate}
              aria-current={aktif ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                aktif
                  ? "bg-primary text-primary-foreground shadow-elegant"
                  : "text-foreground/70 hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
              {m.label}
            </Link>
          );
        })}
      </nav>
      <div className="m-3 rounded-2xl border border-primary/20 bg-primary-soft/50 p-4">
        <p className="font-display text-sm font-semibold">Ücretsiz Plan</p>
        <p className="mt-1 text-xs text-muted-foreground">
          1 etkinlik · 100 yükleme hakkı
        </p>
        <Link
          href="/panel/ayarlar"
          onClick={onNavigate}
          className="mt-3 inline-flex text-xs font-medium text-primary-deep hover:underline"
        >
          Profesyonel&apos;e geç →
        </Link>
      </div>
      <div className="px-3 pb-4">
        <CikisButonu />
      </div>
    </>
  );
}

// Oturumu kapatır ve giriş sayfasına tam-sayfa döner
// (çerez sunucudan da temizlensin diye window.location kullanılır).
function CikisButonu() {
  const [cikiliyor, setCikiliyor] = useState(false);

  async function cikisYap() {
    if (cikiliyor) return;
    setCikiliyor(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // Ağ hatası olsa bile yine de giriş sayfasına gönder.
    }
    window.location.assign("/giris");
  }

  return (
    <button
      type="button"
      onClick={cikisYap}
      disabled={cikiliyor}
      className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-foreground/70 transition-colors hover:bg-muted hover:text-foreground disabled:opacity-60"
    >
      {cikiliyor ? (
        <Loader2 className="h-[18px] w-[18px] animate-spin" />
      ) : (
        <LogOut className="h-[18px] w-[18px]" />
      )}
      Çıkış Yap
    </button>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card/60 lg:flex">
      <div className="flex h-16 items-center px-6">
        <Logo />
      </div>
      <NavIcerik />
    </aside>
  );
}

// Mobil/tablet için: header'a yerleşen menü düğmesi + açılır çekmece.
// lg ve üzeri ekranlarda gizlenir (orada sabit Sidebar görünür).
export function MobilMenu() {
  const [acik, setAcik] = useState(false);
  const pathname = usePathname();

  // Sayfa değişince çekmeceyi kapat.
  useEffect(() => {
    setAcik(false);
  }, [pathname]);

  // Açıkken arka plan kaymasını engelle.
  useEffect(() => {
    if (!acik) return;
    const eski = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = eski;
    };
  }, [acik]);

  // Esc ile kapat.
  useEffect(() => {
    if (!acik) return;
    const f = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAcik(false);
    };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, [acik]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setAcik(true)}
        className="rounded-lg p-2 text-foreground/70 hover:bg-muted"
        aria-label="Menüyü aç"
        aria-expanded={acik}
        aria-controls="mobil-menu-cekmece"
      >
        <Menu className="h-5 w-5" />
      </button>

      {acik && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setAcik(false)}
            aria-hidden="true"
          />
          <aside
            id="mobil-menu-cekmece"
            role="dialog"
            aria-modal="true"
            aria-label="Gezinme menüsü"
            className="absolute left-0 top-0 flex h-full w-64 max-w-[80%] flex-col border-r border-border bg-card shadow-elegant"
          >
            <div className="flex h-16 items-center justify-between px-6">
              <Logo />
              <button
                type="button"
                onClick={() => setAcik(false)}
                className="rounded-lg p-2 text-foreground/70 hover:bg-muted"
                aria-label="Menüyü kapat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavIcerik onNavigate={() => setAcik(false)} />
          </aside>
        </div>
      )}
    </div>
  );
}
