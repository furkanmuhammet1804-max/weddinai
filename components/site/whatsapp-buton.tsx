"use client";

import { usePathname } from "next/navigation";
import {
  siparisLinki,
  instagramLinki,
  WHATSAPP_VAR,
} from "@/lib/iletisim";
import { WhatsAppGlif, InstagramGlif } from "@/components/site/marka-ikonlar";

// Sağ-alt kayan iletişim dock'u (Instagram üstte, WhatsApp altta).
// Premium şampanya-gold tasarım — yönetim/yükleme/slayt/davetiye ekranlarında
// gizlenir. Davetiye yayın deneyimi sade ve dikkat dağıtmayacak kalmalı.
const GIZLI = ["/admin", "/e/", "/slayt", "/oda/", "/davetiye"];

// Tek tasarım dili — TÜM renkler aktif site temasından türer (CSS değişkenleri).
// Tema değişince (data-theme) yüzey, glif, hale anında uyum sağlar; reload yok.
const YUZEY: React.CSSProperties = {
  background:
    "linear-gradient(145deg, color-mix(in srgb, var(--accent) 82%, #ffffff) 0%, var(--primary) 52%, var(--primary-deep) 100%)",
  color: "var(--primary-foreground)",
  boxShadow:
    "0 1px 0 rgba(255,255,255,0.35) inset, 0 10px 26px -10px color-mix(in srgb, var(--primary) 60%, transparent)",
};

export function IletisimDock() {
  const pathname = usePathname();
  if (GIZLI.some((p) => pathname === p || pathname.startsWith(p))) return null;

  return (
    <div
      className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      <DockButon
        href={instagramLinki()}
        etiket="Instagram"
        ariaLabel="Instagram'da @weddinai"
      >
        <InstagramGlif className="h-[22px] w-[22px]" />
      </DockButon>

      {WHATSAPP_VAR && (
        <DockButon
          href={siparisLinki()}
          etiket="WhatsApp"
          ariaLabel="WhatsApp ile iletişime geç"
        >
          <WhatsAppGlif className="h-[23px] w-[23px]" />
        </DockButon>
      )}
    </div>
  );
}

function DockButon({
  href,
  etiket,
  ariaLabel,
  children,
}: {
  href: string;
  etiket: string;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      className="group flex items-center gap-2.5"
    >
      {/* Hover etiketi — border/zemin/metin tema renklerinden türer */}
      <span className="pointer-events-none hidden translate-x-1 rounded-full border border-border bg-card/95 px-3 py-1 text-xs font-medium text-primary-deep opacity-0 shadow-sm backdrop-blur transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 sm:inline-block">
        {etiket}
      </span>
      <span
        className="flex h-12 w-12 items-center justify-center rounded-full ring-1 ring-white/40 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:brightness-[1.04] group-active:translate-y-0"
        style={YUZEY}
      >
        {children}
      </span>
    </a>
  );
}
