"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarHeart,
  Images,
  QrCode,
  MonitorPlay,
  BarChart3,
  Settings,
} from "lucide-react";
import { Logo } from "@/components/site/logo";
import { cn } from "@/lib/utils";

const menu = [
  { href: "/panel", label: "Genel Bakış", icon: LayoutDashboard },
  { href: "/panel/etkinlikler", label: "Etkinlikler", icon: CalendarHeart },
  { href: "/panel/medya", label: "Medya Merkezi", icon: Images },
  { href: "/panel/qr", label: "QR Tasarım", icon: QrCode },
  { href: "/panel/slayt", label: "Canlı Slayt", icon: MonitorPlay },
  { href: "/panel/analiz", label: "Analiz", icon: BarChart3 },
  { href: "/panel/ayarlar", label: "Ayarlar", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card/60 lg:flex">
      <div className="flex h-16 items-center px-6">
        <Logo />
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {menu.map((m) => {
          const Icon = m.icon;
          const aktif =
            m.href === "/panel"
              ? pathname === "/panel"
              : pathname.startsWith(m.href);
          return (
            <Link
              key={m.href}
              href={m.href}
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
          href="#"
          className="mt-3 inline-flex text-xs font-medium text-[#9c7740] hover:underline"
        >
          Profesyonel&apos;e geç →
        </Link>
      </div>
    </aside>
  );
}
