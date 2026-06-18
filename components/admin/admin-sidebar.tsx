"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DoorOpen,
  Plus,
  CheckCircle2,
  Inbox,
  BarChart3,
  Heart,
  Menu,
  X,
  LogOut,
  Loader2,
} from "lucide-react";
import { Logo } from "@/components/site/logo";
import { cn } from "@/lib/utils";

const menu = [
  { href: "/admin", label: "Odalar", icon: DoorOpen, tam: true },
  { href: "/admin/oda/yeni", label: "Yeni Oda", icon: Plus },
  { href: "/admin/onaylar", label: "Showroom Onayları", icon: CheckCircle2 },
  { href: "/admin/talepler", label: "Talepler", icon: Inbox },
  { href: "/admin/davetiye", label: "Davetiye Talepleri", icon: Heart },
  { href: "/admin/istatistik", label: "İstatistik", icon: BarChart3 },
];

function NavIcerik({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <>
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain px-3 py-4">
        {menu.map((m) => {
          const Icon = m.icon;
          const aktif =
            m.href === "/admin"
              ? pathname === "/admin" ||
                (pathname.startsWith("/admin/oda/") &&
                  pathname !== "/admin/oda/yeni")
              : m.href === "/admin/oda/yeni"
                ? pathname === "/admin/oda/yeni"
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
      <div className="px-3 pb-4">
        <CikisButonu />
      </div>
    </>
  );
}

function CikisButonu() {
  const [cikiliyor, setCikiliyor] = useState(false);
  async function cikisYap() {
    if (cikiliyor) return;
    setCikiliyor(true);
    try {
      await fetch("/api/admin/cikis", { method: "POST" });
    } catch {
      /* yine de yönlendir */
    }
    window.location.assign("/admin/giris");
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

export function AdminSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card/60 lg:flex">
      <div className="flex h-16 items-center px-6">
        <Logo />
      </div>
      <NavIcerik />
    </aside>
  );
}

export function AdminMobilMenu() {
  const [acik, setAcik] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setAcik(false);
  }, [pathname]);

  useEffect(() => {
    if (!acik) return;
    const eski = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAcik(false);
    };
    window.addEventListener("keydown", esc);
    return () => {
      document.body.style.overflow = eski;
      window.removeEventListener("keydown", esc);
    };
  }, [acik]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setAcik(true)}
        className="rounded-lg p-2 text-foreground/70 hover:bg-muted"
        aria-label="Menüyü aç"
      >
        <Menu className="h-5 w-5" />
      </button>

      {acik && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-foreground/70 backdrop-blur-sm"
            onClick={() => setAcik(false)}
            aria-hidden="true"
          />
          <aside className="absolute left-0 top-0 flex h-full w-72 max-w-[85%] flex-col border-r border-border bg-card shadow-elegant">
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
