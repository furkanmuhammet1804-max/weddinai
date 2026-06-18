"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Logo } from "./logo";
import { ButtonLink } from "@/components/ui/button";
import { TemaSecici } from "@/components/theme/tema-secici";

const baglantilar = [
  { href: "/showroom", label: "Showroom" },
  { href: "/#ozellikler", label: "Özellikler" },
  { href: "/#nasil-calisir", label: "Nasıl Çalışır" },
  { href: "/#sss", label: "S.S.S." },
  { href: "/fiyatlar", label: "Fiyatlar" },
];

export function SiteNav() {
  const [acik, setAcik] = useState(false);

  return (
    <header className="sticky top-0 z-50">
      <div className="glass border-b border-border/60">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Logo priority />

          <div className="hidden items-center gap-8 md:flex">
            {baglantilar.map((b) => (
              <Link
                key={b.href}
                href={b.href}
                className="text-sm text-foreground/70 transition-colors hover:text-foreground"
              >
                {b.label}
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <TemaSecici />
            <span className="h-5 w-px bg-border" aria-hidden />
            <ButtonLink href="/showroom" variant="ghost" size="sm">
              Showroom
            </ButtonLink>
            <ButtonLink href="/musteri" size="sm">
              Müşteri Girişi
            </ButtonLink>
          </div>

          <button
            className="md:hidden rounded-full p-2 text-foreground/80 hover:bg-muted"
            onClick={() => setAcik((v) => !v)}
            aria-label="Menü"
          >
            {acik ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>
      </div>

      <AnimatePresence>
        {acik && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="glass overflow-hidden border-b border-border/60 md:hidden"
          >
            <div className="flex flex-col gap-1 px-5 py-4">
              {baglantilar.map((b) => (
                <Link
                  key={b.href}
                  href={b.href}
                  onClick={() => setAcik(false)}
                  className="rounded-xl px-3 py-2.5 text-sm text-foreground/80 hover:bg-muted"
                >
                  {b.label}
                </Link>
              ))}
              <div className="mt-3 flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2.5">
                <span className="text-xs font-medium text-muted-foreground">
                  Renk teması
                </span>
                <TemaSecici />
              </div>
              <div className="mt-2 flex gap-2">
                <ButtonLink href="/showroom" variant="outline" size="sm" className="flex-1">
                  Showroom
                </ButtonLink>
                <ButtonLink href="/musteri" size="sm" className="flex-1">
                  Müşteri Girişi
                </ButtonLink>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
