"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Download,
  Trash2,
  Heart,
  Play,
} from "lucide-react";
import { medyaListesi, type MedyaDurum } from "@/lib/mock-data";

type Filtre = "tumu" | "onaylandi" | "beklemede" | "video";

const filtreler: { id: Filtre; etiket: string }[] = [
  { id: "tumu", etiket: "Tümü" },
  { id: "onaylandi", etiket: "Onaylanan" },
  { id: "beklemede", etiket: "Bekleyen" },
  { id: "video", etiket: "Videolar" },
];

const durumStil: Record<MedyaDurum, string> = {
  onaylandi: "bg-emerald-50 text-emerald-700",
  beklemede: "bg-amber-50 text-amber-700",
  reddedildi: "bg-rose-soft text-rose",
};

const durumEtiket: Record<MedyaDurum, string> = {
  onaylandi: "Onaylandı",
  beklemede: "Beklemede",
  reddedildi: "Reddedildi",
};

export default function MedyaPage() {
  const [filtre, setFiltre] = useState<Filtre>("tumu");
  const [secili, setSecili] = useState<Set<string>>(new Set());

  const liste = useMemo(() => {
    return medyaListesi.filter((m) => {
      if (filtre === "tumu") return true;
      if (filtre === "video") return m.file_type === "video";
      return m.status === filtre;
    });
  }, [filtre]);

  const oran: Record<string, string> = {
    dikey: "aspect-[3/4]",
    kare: "aspect-square",
    yatay: "aspect-[4/3]",
  };

  function toggle(id: string) {
    setSecili((p) => {
      const yeni = new Set(p);
      if (yeni.has(id)) yeni.delete(id);
      else yeni.add(id);
      return yeni;
    });
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Medya Merkezi
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {medyaListesi.length} öğe · Pinterest tarzı galeri
          </p>
        </div>

        {/* Filtre çipleri */}
        <div className="flex flex-wrap gap-2">
          {filtreler.map((f) => (
            <button
              key={f.id}
              onClick={() => setFiltre(f.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                filtre === f.id
                  ? "bg-primary text-primary-foreground shadow-elegant"
                  : "border border-border bg-card text-foreground/70 hover:border-primary/40"
              }`}
            >
              {f.etiket}
            </button>
          ))}
        </div>
      </div>

      {/* Toplu işlem barı */}
      {secili.size > 0 && (
        <div className="sticky top-20 z-20 mt-5 flex items-center justify-between rounded-2xl border border-primary/30 bg-card px-5 py-3 shadow-elegant">
          <span className="text-sm font-medium">{secili.size} öğe seçildi</span>
          <div className="flex gap-2">
            <button className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-4 py-2 text-sm font-medium text-[#9c7740] hover:bg-primary-soft/70">
              <CheckCircle2 className="h-4 w-4" /> Onayla
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted">
              <Download className="h-4 w-4" /> İndir
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-full bg-rose/15 px-4 py-2 text-sm font-medium text-rose hover:bg-rose/25">
              <Trash2 className="h-4 w-4" /> Sil
            </button>
          </div>
        </div>
      )}

      {/* Masonry */}
      <div className="mt-6 columns-2 gap-4 sm:columns-3 lg:columns-4">
        {liste.map((m) => {
          const isaretli = secili.has(m.id);
          return (
            <div key={m.id} className="mb-4 break-inside-avoid">
              <button
                onClick={() => toggle(m.id)}
                className={`group relative block w-full overflow-hidden rounded-2xl border bg-card text-left transition-all ${
                  isaretli
                    ? "border-primary ring-2 ring-primary/40"
                    : "border-border hover:shadow-elegant"
                }`}
              >
                <div
                  className={`relative ${oran[m.ratio]} w-full bg-gradient-to-br ${m.tone}`}
                >
                  {m.file_type === "video" && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur">
                        <Play className="h-5 w-5 fill-current" />
                      </span>
                    </span>
                  )}
                  {/* Seçim göstergesi */}
                  <span
                    className={`absolute left-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
                      isaretli
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-white/70 bg-black/10 opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    {isaretli && <CheckCircle2 className="h-4 w-4" />}
                  </span>
                  <span
                    className={`absolute right-2.5 top-2.5 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${durumStil[m.status]}`}
                  >
                    {durumEtiket[m.status]}
                  </span>
                </div>
                <div className="flex items-center justify-between px-3 py-2.5">
                  <span className="truncate text-xs text-muted-foreground">
                    {m.guest_name}
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                    <Heart className="h-3.5 w-3.5" /> {m.likes}
                  </span>
                </div>

                {/* Hover hızlı işlemler */}
                {m.status === "beklemede" && (
                  <div className="flex border-t border-border">
                    <span className="flex flex-1 items-center justify-center gap-1 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Onayla
                    </span>
                    <span className="flex flex-1 items-center justify-center gap-1 border-l border-border py-2 text-xs font-medium text-rose hover:bg-rose-soft/60">
                      <XCircle className="h-3.5 w-3.5" /> Reddet
                    </span>
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
