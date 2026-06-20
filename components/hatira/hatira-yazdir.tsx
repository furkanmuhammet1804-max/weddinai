"use client";

// Hatıra Defteri — "PDF olarak kaydet" (bağımlılıksız: tarayıcı yazdırma).
// print: stilleriyle yalnızca defter içeriği yazdırılır.
import { Download } from "lucide-react";

export function HatiraYazdir() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-elegant transition-all hover:brightness-110 print:hidden"
    >
      <Download className="h-4 w-4" /> PDF olarak kaydet
    </button>
  );
}
