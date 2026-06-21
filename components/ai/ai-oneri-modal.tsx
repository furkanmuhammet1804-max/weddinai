"use client";

// =============================================================
// Genel AI Öneri Modalı — yeniden kullanılabilir (Özellik 1 & 2).
// {"oneriler": [...]} dönen herhangi bir AI ucuna bağlanır; bir "seçenek"
// (ton/kategori) çubuğu gösterir, 3 öneri üretir, her biri kopyalanabilir
// veya hedefe aktarılabilir.
//
// KRİTİK: createPortal ile document.body'ye basılır (üst katmanlardaki
// backdrop-filter tuzağını aşar). Kopyalama clipboard + manuel fallback.
// (Mevcut components/davetiye/ai-yardim-modal.tsx ile aynı UX deseni.)
// =============================================================
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Sparkles,
  X,
  Loader2,
  RefreshCw,
  Copy,
  Check,
  ArrowDownToLine,
} from "lucide-react";

export interface AiOneriSecenek {
  deger: string; // sunucuya gönderilecek değer
  etiket: string; // kullanıcıya gösterilecek
}

interface Props {
  baslik: string;
  altBaslik?: string;
  endpoint: string;
  secenekEtiket: string; // ör. "Ton" / "Tür"
  secenekler: AiOneriSecenek[];
  // Seçili değere göre POST gövdesini kurar.
  govde: (secenekDeger: string) => Record<string, unknown>;
  onAktar: (metin: string) => void;
  onClose: () => void;
  aktarEtiket?: string;
}

async function panoyaKopyala(metin: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(metin);
      return true;
    }
  } catch {
    /* fallback'e düş */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = metin;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    ta.setAttribute("readonly", "");
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export function AiOneriModal({
  baslik,
  altBaslik,
  endpoint,
  secenekEtiket,
  secenekler,
  govde,
  onAktar,
  onClose,
  aktarEtiket = "Aktar",
}: Props) {
  const [secili, setSecili] = useState(secenekler[0]?.deger ?? "");
  const [oneriler, setOneriler] = useState<string[]>([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [kopyalanan, setKopyalanan] = useState<number | null>(null);
  const ilkCalisma = useRef(true);

  // ESC ile kapat + arka plan kaydırmasını kilitle.
  useEffect(() => {
    const eski = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", esc);
    return () => {
      document.body.style.overflow = eski;
      window.removeEventListener("keydown", esc);
    };
  }, [onClose]);

  async function uret() {
    if (yukleniyor) return;
    setYukleniyor(true);
    setHata(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(govde(secili)),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        throw new Error(data.hata ?? "Öneri üretilemedi.");
      }
      setOneriler(Array.isArray(data.oneriler) ? data.oneriler : []);
    } catch (err) {
      setHata(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setYukleniyor(false);
    }
  }

  // Açılışta otomatik bir kez üret.
  useEffect(() => {
    if (ilkCalisma.current) {
      ilkCalisma.current = false;
      uret();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function kopyala(i: number) {
    const ok = await panoyaKopyala(oneriler[i]);
    if (ok) {
      setKopyalanan(i);
      setTimeout(() => setKopyalanan((k) => (k === i ? null : k)), 1800);
    }
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={baslik}
    >
      <div
        className="absolute inset-0 bg-foreground/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl border border-border bg-card shadow-elegant sm:rounded-3xl">
        {/* Başlık */}
        <header className="flex items-start justify-between gap-3 border-b border-border px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary-deep">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-lg font-semibold leading-tight">
                {baslik}
              </h2>
              {altBaslik && (
                <p className="text-xs text-muted-foreground">{altBaslik}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Seçenek çubuğu */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-6 py-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {secenekEtiket}
          </span>
          {secenekler.map((s) => (
            <button
              key={s.deger}
              type="button"
              onClick={() => setSecili(s.deger)}
              aria-pressed={secili === s.deger}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                secili === s.deger
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-foreground/70 hover:border-primary/40"
              }`}
            >
              {s.etiket}
            </button>
          ))}
        </div>

        {/* Gövde */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {yukleniyor && oneriler.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center text-sm text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p>Öneriler hazırlanıyor…</p>
            </div>
          )}

          {hata && (
            <p className="rounded-2xl bg-rose-soft px-4 py-3 text-sm font-medium text-rose">
              {hata}
            </p>
          )}

          {oneriler.length > 0 && (
            <ul className="space-y-3">
              {oneriler.map((metin, i) => (
                <li
                  key={i}
                  className="rounded-2xl border border-border bg-background/40 p-4"
                >
                  <p className="whitespace-pre-line text-[15px] leading-relaxed text-foreground">
                    {metin}
                  </p>
                  <div className="mt-3 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => kopyala(i)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground/70 transition-colors hover:border-primary hover:text-primary-deep"
                    >
                      {kopyalanan === i ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" /> Kopyalandı
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" /> Kopyala
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => onAktar(metin)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-all hover:brightness-110"
                    >
                      <ArrowDownToLine className="h-3.5 w-3.5" /> {aktarEtiket}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Alt aksiyon */}
        <footer className="border-t border-border px-6 py-4">
          <button
            type="button"
            onClick={uret}
            disabled={yukleniyor}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-primary/40 py-3 text-sm font-semibold text-primary-deep transition-colors hover:bg-primary-soft/50 disabled:opacity-60"
          >
            {yukleniyor ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Üretiliyor…
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" /> Yeniden oluştur
              </>
            )}
          </button>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Öneriler yapay zekâ ile üretilir; dilediğiniz gibi düzenleyebilirsiniz.
          </p>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
