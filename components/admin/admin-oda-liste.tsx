"use client";

// =============================================================
// Admin oda listesi — kart ızgarası + TOPLU SEÇİM/SİLME modu.
// Normal modda kartlar oda detayına link; seçim modunda tıklama seçer.
// Toplu silme tek uçtan (/api/admin/oda-toplu-sil) yapılır, geri alınamaz.
// =============================================================
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarHeart,
  Clock,
  Images,
  CheckCircle2,
  CheckSquare,
  Square,
  Trash2,
  X,
  Loader2,
} from "lucide-react";
import type { AdminOdaOzet } from "@/lib/oda/veri";
import { turEtiket, tarihTR } from "@/lib/etkinlik";

// Süresi dolmasına kalan gün (lib/oda/veri.kalanGun ile aynı; server modülü
// client'a sızmasın diye burada minik kopya).
function kalanGun(expires_at: string | null | undefined): number | null {
  if (!expires_at) return null;
  const ms = new Date(expires_at).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export function AdminOdaListe({ liste }: { liste: AdminOdaOzet[] }) {
  const router = useRouter();
  const [secimModu, setSecimModu] = useState(false);
  const [secili, setSecili] = useState<Set<string>>(new Set());
  const [siliniyor, setSiliniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  function toggle(id: string) {
    setSecili((o) => {
      const y = new Set(o);
      if (y.has(id)) y.delete(id);
      else y.add(id);
      return y;
    });
  }

  function tumunuSec() {
    setSecili(new Set(liste.map((o) => o.id)));
  }

  function secimiKapat() {
    setSecimModu(false);
    setSecili(new Set());
    setHata(null);
  }

  async function topluSil() {
    if (siliniyor || secili.size === 0) return;
    const onay = window.prompt(
      `${secili.size} odayı ve bu odalardaki TÜM fotoğraf/video/anıları kalıcı olarak silmek üzeresiniz. Bu işlem geri ALINAMAZ.\n\nOnaylamak için SİL yazın:`,
    );
    if ((onay ?? "").trim().toLocaleUpperCase("tr") !== "SİL") return;
    setSiliniyor(true);
    setHata(null);
    try {
      const res = await fetch("/api/admin/oda-toplu-sil", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...secili] }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.hata ?? "Silinemedi.");
      secimiKapat();
      router.refresh();
    } catch (err) {
      setHata(err instanceof Error ? err.message : "Odalar silinemedi.");
    } finally {
      setSiliniyor(false);
    }
  }

  const hepsiSecili = secili.size === liste.length && liste.length > 0;

  return (
    <div className="mt-7">
      {/* Araç çubuğu */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{liste.length} oda</p>
        <div className="flex items-center gap-2">
          {!secimModu ? (
            <button
              type="button"
              onClick={() => setSecimModu(true)}
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-rose hover:text-rose"
            >
              <CheckSquare className="h-4 w-4" /> Toplu Sil
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={hepsiSecili ? () => setSecili(new Set()) : tumunuSec}
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
              >
                {hepsiSecili ? "Seçimi kaldır" : "Tümünü seç"}
              </button>
              <button
                type="button"
                onClick={secimiKapat}
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
              >
                <X className="h-4 w-4" /> Vazgeç
              </button>
            </>
          )}
        </div>
      </div>

      {hata && (
        <p className="mb-4 rounded-2xl bg-rose/10 px-4 py-3 text-sm font-medium text-rose">
          {hata}
        </p>
      )}

      {/* Izgara */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {liste.map((oda) => {
          const gun = kalanGun(oda.expires_at);
          const isSecili = secili.has(oda.id);

          const govde = (
            <>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft/60 px-2.5 py-1 text-xs font-medium text-primary-deep">
                  <CalendarHeart className="h-3 w-3" />
                  {turEtiket(oda.event_type)}
                </span>
                {secimModu ? (
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-md border-2 transition-colors ${
                      isSecili
                        ? "border-rose bg-rose text-white"
                        : "border-border text-transparent"
                    }`}
                  >
                    {isSecili ? (
                      <CheckSquare className="h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4 text-muted-foreground" />
                    )}
                  </span>
                ) : (
                  <DurumRozet durum={oda.status} gun={gun} />
                )}
              </div>
              <h3 className="font-display mt-3 text-lg font-semibold">{oda.title}</h3>
              {oda.customer_name ? (
                <p className="text-sm text-muted-foreground">{oda.customer_name}</p>
              ) : null}
              <p className="mt-1 text-xs text-muted-foreground">
                {oda.event_date ? tarihTR(oda.event_date) : "Tarih belirtilmedi"}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-muted-foreground">
                  <Images className="h-3 w-3" /> {oda.medya_sayi} medya
                </span>
                {oda.bekleyen_onay > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 font-medium text-amber-700">
                    <CheckCircle2 className="h-3 w-3" /> {oda.bekleyen_onay} onay
                  </span>
                )}
                {gun !== null && (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${
                      gun <= 2
                        ? "bg-rose/10 font-medium text-rose"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Clock className="h-3 w-3" /> {gun} gün
                  </span>
                )}
              </div>
            </>
          );

          if (secimModu) {
            return (
              <button
                key={oda.id}
                type="button"
                onClick={() => toggle(oda.id)}
                className={`flex flex-col rounded-2xl border p-5 text-left shadow-sm transition-all ${
                  isSecili
                    ? "border-rose ring-2 ring-rose/30"
                    : "border-border bg-card hover:border-rose/40"
                }`}
              >
                {govde}
              </button>
            );
          }

          return (
            <Link
              key={oda.id}
              href={`/admin/oda/${oda.id}`}
              className="group flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-elegant"
            >
              {govde}
              <div className="mt-4 flex items-center gap-1.5 text-sm font-medium text-primary-deep">
                Odayı yönet
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Seçim alt çubuğu */}
      {secimModu && (
        <div className="sticky bottom-4 z-30 mt-6 flex items-center justify-between gap-3 rounded-2xl border border-border bg-card/95 px-5 py-3 shadow-elegant backdrop-blur-md">
          <p className="text-sm font-medium">{secili.size} oda seçili</p>
          <button
            type="button"
            disabled={secili.size === 0 || siliniyor}
            onClick={topluSil}
            className="inline-flex items-center gap-2 rounded-full bg-rose px-5 py-2.5 text-sm font-semibold text-white shadow-elegant transition-all hover:brightness-110 disabled:opacity-50"
          >
            {siliniyor ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Seçilenleri Sil
          </button>
        </div>
      )}
    </div>
  );
}

function DurumRozet({ durum, gun }: { durum: string; gun: number | null }) {
  if (gun === 0) {
    return (
      <span className="rounded-full bg-rose/10 px-2.5 py-1 text-xs font-medium text-rose">
        Süresi doldu
      </span>
    );
  }
  const harita: Record<string, { etiket: string; sinif: string }> = {
    aktif: { etiket: "Aktif", sinif: "bg-emerald-100 text-emerald-700" },
    taslak: { etiket: "Taslak", sinif: "bg-muted text-muted-foreground" },
    arsivlendi: { etiket: "Pasif", sinif: "bg-muted text-muted-foreground" },
  };
  const v = harita[durum] ?? harita.taslak;
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${v.sinif}`}>
      {v.etiket}
    </span>
  );
}
