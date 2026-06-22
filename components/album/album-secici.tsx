"use client";

// =============================================================
// Müşteri Albüm Hazırlama (F5 V2). Bağımlılıksız sürükle-bırak (HTML5 draggable):
// foto seçimi (limit kontrollü), sıralama, kapak, bölüm. "Tamamla" sonrası
// readonly. Albümü admin üretir (PDF). Tüm yazma token-gated public uçlardan.
// =============================================================
import { useEffect, useMemo, useRef, useState } from "react";
import {
  GripVertical,
  Star,
  X,
  Plus,
  Save,
  Loader2,
  CheckCircle2,
  Lock,
  ShieldCheck,
  Download,
  ImageIcon,
  Check,
} from "lucide-react";
import { BOLUM_DUZEN, VARSAYILAN_BOLUM, paketEtiket } from "@/lib/album/sabit";
import type { AlbumSecimVeri } from "@/lib/album/veri";

interface Secili {
  media_id: string;
  url: string | null;
  bolum: string | null;
}
interface Havuz {
  media_id: string;
  url: string | null;
}

export function AlbumSecici({
  token,
  veri,
}: {
  token: string;
  veri: AlbumSecimVeri;
}) {
  const [secili, setSecili] = useState<Secili[]>(
    veri.secili.map((f) => ({ media_id: f.media_id, url: f.url, bolum: f.bolum })),
  );
  const [havuz, setHavuz] = useState<Havuz[]>(veri.havuz);
  const [kapak, setKapak] = useState<string | null>(veri.kapak_media_id);
  const [tamamlandi, setTamamlandi] = useState(veri.tamamlandi);
  const [islem, setIslem] = useState<null | "kaydet" | "tamamla">(null);
  const [mesaj, setMesaj] = useState<string | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [kapakModal, setKapakModal] = useState(false);
  const surukle = useRef<number | null>(null);

  const limit = veri.limit_adet;
  const dolu = secili.length >= limit;

  function bildir(m: string) {
    setMesaj(m);
    setTimeout(() => setMesaj((x) => (x === m ? null : x)), 2500);
  }

  function birak(hedef: number) {
    const kaynak = surukle.current;
    surukle.current = null;
    if (kaynak === null || kaynak === hedef) return;
    setSecili((onceki) => {
      const kopya = [...onceki];
      const [tasinan] = kopya.splice(kaynak, 1);
      kopya.splice(hedef, 0, tasinan);
      return kopya;
    });
  }

  function bolumDegistir(i: number, bolum: string) {
    setSecili((o) => o.map((f, j) => (j === i ? { ...f, bolum } : f)));
  }

  function cikar(i: number) {
    setSecili((o) => {
      const f = o[i];
      setHavuz((h) => [{ media_id: f.media_id, url: f.url }, ...h]);
      if (kapak === f.media_id) setKapak(null);
      return o.filter((_, j) => j !== i);
    });
  }

  function ekle(h: Havuz) {
    if (secili.length >= limit) {
      bildir(`En fazla ${limit} fotoğraf seçebilirsiniz.`);
      return;
    }
    setSecili((o) => [...o, { media_id: h.media_id, url: h.url, bolum: VARSAYILAN_BOLUM }]);
    setHavuz((arr) => arr.filter((x) => x.media_id !== h.media_id));
  }

  async function kaydet(): Promise<boolean> {
    if (islem) return false;
    setIslem("kaydet");
    setHata(null);
    try {
      const res = await fetch("/api/album-sec/kaydet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          kapakMediaId: kapak,
          fotograflar: secili.map((f, i) => ({
            media_id: f.media_id,
            bolum: f.bolum,
            sira: i,
          })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.hata ?? "Kaydedilemedi.");
      bildir("Seçiminiz kaydedildi.");
      return true;
    } catch (err) {
      setHata(err instanceof Error ? err.message : "Bir hata oluştu.");
      return false;
    } finally {
      setIslem(null);
    }
  }

  async function tamamla() {
    if (islem) return;
    if (secili.length === 0) {
      setHata("Önce en az bir fotoğraf seçin.");
      return;
    }
    if (
      !window.confirm(
        "Albüm seçiminizi tamamlıyorsunuz. Tamamladıktan sonra DEĞİŞİKLİK YAPAMAZSINIZ. Onaylıyor musunuz?",
      )
    )
      return;
    const kaydedildi = await kaydet();
    if (!kaydedildi) return;
    setIslem("tamamla");
    setHata(null);
    try {
      const res = await fetch("/api/album-sec/tamamla", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.hata ?? "Tamamlanamadı.");
      setTamamlandi(true);
    } catch (err) {
      setHata(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setIslem(null);
    }
  }

  // Seçili kapak (yoksa ilk fotoğraf önizlenir) — ayrı kapak alanı için.
  const kapakFoto = useMemo(
    () => secili.find((f) => f.media_id === kapak) ?? secili[0] ?? null,
    [secili, kapak],
  );

  const bolumSayim = useMemo(() => {
    const m = new Map<string, number>();
    for (const f of secili) {
      const b = f.bolum ?? VARSAYILAN_BOLUM;
      m.set(b, (m.get(b) ?? 0) + 1);
    }
    return m;
  }, [secili]);

  // Kapak modalı açıkken arka plan kaymasın + Esc ile kapansın.
  useEffect(() => {
    if (!kapakModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setKapakModal(false);
    };
    window.addEventListener("keydown", onKey);
    const eski = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = eski;
    };
  }, [kapakModal]);

  function kapakSec(mediaId: string) {
    setKapak(mediaId);
    setKapakModal(false);
  }

  // ---- Tamamlandı: readonly özet ----
  if (tamamlandi) {
    return (
      <main className="bg-aura flex min-h-screen flex-col items-center px-5 py-12">
        <div className="w-full max-w-xl">
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-7 text-center shadow-elegant">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
            <h1 className="font-display mt-3 text-2xl font-semibold text-emerald-800">
              Albümünüz hazır 💛
            </h1>
            <p className="mt-2 text-sm text-emerald-700">
              Seçtiğiniz {secili.length} fotoğrafla albümünüz oluşturuldu. PDF
              olarak hemen indirebilirsiniz.
            </p>
            <a
              href={`/api/album-sec/pdf?token=${encodeURIComponent(token)}`}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-elegant transition-all hover:brightness-110"
            >
              <Download className="h-4 w-4" /> Albümü PDF İndir
            </a>
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            <span className="font-display">WeddinAI</span> · Seçiminiz kilitlendi,
            değişiklik yapılamaz. Albümünüzü istediğiniz zaman yeniden indirebilirsiniz.
          </p>
        </div>
      </main>
    );
  }

  // ---- Seçim ekranı ----
  return (
    <main className="bg-aura min-h-screen px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-deep">
            Albüm Hazırlama
          </p>
          <h1 className="font-display mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            {veri.event_title || veri.baslik}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Albümünüze girecek fotoğrafları seçin, sıralayın, kapak ve bölümlerini
            belirleyin. Bittiğinde <strong>“Albüm Seçimimi Tamamla”</strong>ya basın.
          </p>

          {/* Sayaç */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                dolu
                  ? "bg-amber-100 text-amber-800"
                  : "bg-primary-soft text-primary-deep"
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              {secili.length} / {limit} seçildi
            </span>
            <span className="text-xs text-muted-foreground">
              Paket: {paketEtiket(veri.paket)} · {limit} fotoğraf hakkı
            </span>
          </div>

          {mesaj && (
            <p className="mt-4 inline-flex items-center gap-1.5 rounded-2xl bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700">
              <CheckCircle2 className="h-4 w-4" /> {mesaj}
            </p>
          )}
          {hata && (
            <p className="mt-4 rounded-2xl bg-rose-soft px-4 py-3 text-sm font-medium text-rose">
              {hata}
            </p>
          )}

          {/* Aksiyonlar */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={kaydet}
              disabled={!!islem}
              className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground/70 transition-colors hover:border-primary hover:text-primary-deep disabled:opacity-60"
            >
              {islem === "kaydet" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Taslağı Kaydet
            </button>
            <button
              type="button"
              onClick={tamamla}
              disabled={!!islem || secili.length === 0}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-60"
            >
              {islem === "tamamla" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              Albüm Seçimimi Tamamla
            </button>
          </div>
        </div>

        {/* Albüm Kapağı — yalnızca seçili kapağın büyük önizlemesi */}
        <section className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <h2 className="font-display text-lg font-semibold tracking-tight">
            Albüm Kapağı
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Albümünüzün ön kapağında bu fotoğraf görünür.
          </p>

          <div className="mt-6 flex flex-col items-center gap-5">
            <div className="w-full max-w-[230px]">
              <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-muted shadow-elegant ring-1 ring-black/5">
                {kapakFoto?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={kapakFoto.url}
                    alt="Albüm kapağı"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
                    <ImageIcon className="h-8 w-8 opacity-50" />
                    <span className="text-xs">Henüz kapak yok</span>
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setKapakModal(true)}
              disabled={secili.length === 0}
              className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground/80 transition-colors hover:border-primary hover:text-primary-deep disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ImageIcon className="h-4 w-4" />
              Kapak Fotoğrafını Değiştir
            </button>
            {secili.length === 0 && (
              <p className="text-center text-xs text-muted-foreground">
                Önce aşağıdan albümünüze fotoğraf ekleyin.
              </p>
            )}
          </div>
        </section>

        {/* Seçilenler (sürükle-bırak sırala) */}
        <h2 className="font-display mt-8 text-lg font-semibold">
          Albümünüz ({secili.length})
        </h2>
        <p className="text-xs text-muted-foreground">
          Sıralamak için sürükleyip bırakın. Yıldız = kapak. Açılır menü = bölüm.
        </p>
        {secili.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-dashed border-border bg-card/50 px-4 py-10 text-center text-sm text-muted-foreground">
            Henüz fotoğraf seçmediniz. Aşağıdaki fotoğraflardan ekleyin.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {secili.map((f, i) => (
              <div
                key={f.media_id}
                draggable
                onDragStart={() => (surukle.current = i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => birak(i)}
                className={`overflow-hidden rounded-2xl border bg-card ${
                  kapak === f.media_id
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-border"
                }`}
              >
                <div className="relative aspect-square bg-muted">
                  {f.url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={f.url}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  )}
                  <span className="absolute left-1 top-1 cursor-grab rounded-md bg-black/45 p-1 text-white">
                    <GripVertical className="h-3.5 w-3.5" />
                  </span>
                  <span className="absolute bottom-1 left-1 rounded-full bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    #{i + 1}
                  </span>
                  {kapak === f.media_id && (
                    <span className="absolute bottom-1 right-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                      Kapak
                    </span>
                  )}
                  <div className="absolute right-1 top-1 flex gap-1">
                    <button
                      type="button"
                      onClick={() => setKapak(f.media_id)}
                      title="Kapak yap"
                      className={`rounded-full p-1 ${
                        kapak === f.media_id
                          ? "bg-primary text-primary-foreground"
                          : "bg-black/45 text-white"
                      }`}
                    >
                      <Star className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => cikar(i)}
                      title="Albümden çıkar"
                      className="rounded-full bg-black/45 p-1 text-white hover:bg-rose"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="p-2">
                  <select
                    value={f.bolum ?? VARSAYILAN_BOLUM}
                    onChange={(e) => bolumDegistir(i, e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary"
                  >
                    {BOLUM_DUZEN.map((b) => (
                      <option key={b} value={b}>
                        {b}
                        {bolumSayim.get(b) ? ` (${bolumSayim.get(b)})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Havuz: odanızın diğer fotoğrafları */}
        <h2 className="font-display mt-10 text-lg font-semibold">
          Fotoğraflarınız ({havuz.length})
        </h2>
        <p className="text-xs text-muted-foreground">
          Albüme eklemek için bir fotoğrafa dokunun.{" "}
          {dolu && <span className="text-amber-600">Limit doldu.</span>}
        </p>
        {havuz.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">
            Eklenecek başka fotoğraf yok.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-6">
            {havuz.map((h) => (
              <button
                key={h.media_id}
                type="button"
                onClick={() => ekle(h)}
                disabled={dolu}
                className="relative aspect-square overflow-hidden rounded-lg border border-border hover:ring-2 hover:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {h.url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={h.url}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                )}
                {!dolu && (
                  <span className="absolute right-1 top-1 rounded-full bg-primary p-0.5 text-primary-foreground">
                    <Plus className="h-3 w-3" />
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        <p className="mt-10 text-center text-xs text-muted-foreground">
          <span className="font-display">WeddinAI</span> · Yalnızca kendi odanızın
          fotoğrafları gösterilir.
        </p>
      </div>

      {/* Kapak seçim modalı — albümdeki seçili fotoğraflardan */}
      {kapakModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-6"
          onClick={() => setKapakModal(false)}
        >
          <div
            className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-card shadow-elegant sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h3 className="font-display text-base font-semibold">
                  Kapak Fotoğrafını Seç
                </h3>
                <p className="text-xs text-muted-foreground">
                  Albümünüzdeki fotoğraflardan birine dokunun.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setKapakModal(false)}
                aria-label="Kapat"
                className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="overflow-y-auto p-4">
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {secili.map((f) => {
                  const seciliKapak = kapak === f.media_id;
                  return (
                    <button
                      key={f.media_id}
                      type="button"
                      onClick={() => kapakSec(f.media_id)}
                      className={`relative aspect-square overflow-hidden rounded-xl transition-all ${
                        seciliKapak
                          ? "ring-2 ring-primary ring-offset-2 ring-offset-card"
                          : "ring-1 ring-black/5 hover:ring-2 hover:ring-primary/50"
                      }`}
                    >
                      {f.url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={f.url}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      )}
                      {seciliKapak && (
                        <span className="absolute inset-0 flex items-center justify-center bg-primary/25">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                            <Check className="h-4 w-4" />
                          </span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
