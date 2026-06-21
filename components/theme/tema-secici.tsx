"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import {
  TEMALAR,
  VARSAYILAN_TEMA,
  TEMA_DEPO_ANAHTARI,
  type TemaId,
} from "@/lib/temalar";

function temayiUygula(id: TemaId) {
  const kok = document.documentElement;
  kok.classList.add("tema-gecis");
  if (id === VARSAYILAN_TEMA) kok.removeAttribute("data-theme");
  else kok.setAttribute("data-theme", id);
  try {
    localStorage.setItem(TEMA_DEPO_ANAHTARI, id);
  } catch {
    // localStorage erişilemezse sessizce geç
  }
  window.setTimeout(() => kok.classList.remove("tema-gecis"), 500);
}

function mevcutTema(): TemaId {
  const t = document.documentElement.getAttribute("data-theme") as TemaId | null;
  return t ?? VARSAYILAN_TEMA;
}

/**
 * variant="kompakt" → yan yana renk yuvarlakları (site menüsü için)
 * variant="tam"     → etiketli seçilebilir kartlar (panel ayarları için)
 */
export function TemaSecici({
  variant = "kompakt",
}: {
  variant?: "kompakt" | "tam";
}) {
  const [aktif, setAktif] = useState<TemaId>(VARSAYILAN_TEMA);

  // İlk yüklemede gerçek temayı oku (flash-script zaten data-theme'i ayarladı).
  // Tarayıcı-yalnız okuma; mount sonrası kasıtlı.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setAktif(mevcutTema()), []);

  function sec(id: TemaId) {
    temayiUygula(id);
    setAktif(id);
  }

  if (variant === "tam") {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {TEMALAR.map((t) => {
          const secili = aktif === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => sec(t.id)}
              aria-pressed={secili}
              className={`group relative flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-all hover:-translate-y-0.5 ${
                secili
                  ? "border-primary bg-primary-soft/50 shadow-elegant"
                  : "border-border bg-card hover:border-primary/50"
              }`}
            >
              <span
                className="h-9 w-9 shrink-0 rounded-full ring-1 ring-black/5"
                style={{ background: t.nokta }}
              />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{t.ad}</span>
                <span className="block text-xs text-muted-foreground">
                  {secili ? "Seçili" : "Uygula"}
                </span>
              </span>
              {secili && (
                <span className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3 w-3" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // kompakt
  return (
    <div
      className="flex items-center gap-1.5"
      role="group"
      aria-label="Renk teması"
    >
      {TEMALAR.map((t) => {
        const secili = aktif === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => sec(t.id)}
            title={t.ad}
            aria-label={`${t.ad} teması`}
            aria-pressed={secili}
            className={`h-5 w-5 rounded-full ring-offset-2 ring-offset-background transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              secili ? "ring-2 ring-primary scale-110" : "ring-1 ring-black/10"
            }`}
            style={{ background: t.nokta }}
          />
        );
      })}
    </div>
  );
}
