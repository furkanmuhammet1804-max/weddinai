"use client";

import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { siparisLinki, WHATSAPP_VAR } from "@/lib/iletisim";

// Sağ-alt kayan WhatsApp butonu. Yükleme/yönetim/slayt ekranlarında gizlenir.
const GIZLI = ["/admin", "/e/", "/slayt", "/oda/"];

export function WhatsAppButon() {
  const pathname = usePathname();
  if (!WHATSAPP_VAR) return null;
  if (GIZLI.some((p) => pathname === p || pathname.startsWith(p))) return null;

  return (
    <a
      href={siparisLinki()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp ile iletişime geç"
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-elegant transition-transform hover:scale-105"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}
