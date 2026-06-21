"use client";

// =============================================================
// Admin — AI Albüm editörü (Özellik 5). Sürükle-bırak sıralama, kapak seçimi,
// bölüm düzenleme, havuzdan ekle/çıkar, kaydet, yayınla. Bağımlılıksız DnD
// (HTML5 draggable). Otomatik yayın yok.
// =============================================================
import { useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Loader2,
  Globe,
  Undo2,
  ExternalLink,
  Star,
  X,
  Plus,
  GripVertical,
  CheckCircle2,
  Link2,
  FileDown,
} from "lucide-react";
import { BOLUM_DUZEN, paketEtiket } from "@/lib/album/sabit";

interface Foto {
  media_id: string;
  url: string | null;
  bolum: string | null;
}
interface HavuzFoto {
  media_id: string;
  url: string | null;
  kategori: string | null;
}

interface Props {
  id: string;
  eventTitle: string;
  baslikIlk: string;
  paket: string;
  durumIlk: string;
  slugIlk: string | null;
  kapakIlk: string | null;
  fotograflarIlk: Foto[];
  havuz: HavuzFoto[];
}

export function AlbumEditor({
  id,
  eventTitle,
  baslikIlk,
  paket,
  durumIlk,
  slugIlk,
  kapakIlk,
  fotograflarIlk,
  havuz: havuzIlk,
}: Props) {
  const [baslik, setBaslik] = useState(baslikIlk);
  const [fotolar, setFotolar] = useState<Foto[]>(fotograflarIlk);
  const [havuz, setHavuz] = useState<HavuzFoto[]>(havuzIlk);
  const [kapak, setKapak] = useState<string | null>(kapakIlk);
  const [durum, setDurum] = useState(durumIlk);
  const [slug, setSlug] = useState(slugIlk);
  const [havuzAcik, setHavuzAcik] = useState(false);
  const [islem, setIslem] = useState<null | "kaydet" | "yayin">(null);
  const [mesaj, setMesaj] = useState<string | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const surukle = useRef<number | null>(null);

  function bildir(m: string) {
    setMesaj(m);
    setTimeout(() => setMesaj((x) => (x === m ? null : x)), 2500);
  }

  function birak(hedef: number) {
    const kaynak = surukle.current;
    surukle.current = null;
    if (kaynak === null || kaynak === hedef) return;
    setFotolar((onceki) => {
      const kopya = [...onceki];
      const [tasinan] = kopya.splice(kaynak, 1);
      kopya.splice(hedef, 0, tasinan);
      return kopya;
    });
  }

  function bolumDegistir(i: number, bolum: string) {
    setFotolar((o) => o.map((f, j) => (j === i ? { ...f, bolum } : f)));
  }

  function cikar(i: number) {
    setFotolar((o) => {
      const f = o[i];
      setHavuz((h) => [{ media_id: f.media_id, url: f.url, kategori: null }, ...h]);
      if (kapak === f.media_id) setKapak(null);
      return o.filter((_, j) => j !== i);
    });
  }

  function havuzdanEkle(h: HavuzFoto) {
    setFotolar((o) => [...o, { media_id: h.media_id, url: h.url, bolum: "Diğer" }]);
    setHavuz((arr) => arr.filter((x) => x.media_id !== h.media_id));
  }

  async function kaydet(): Promise<boolean> {
    if (islem) return false;
    setIslem("kaydet");
    setHata(null);
    try {
      const res = await fetch("/api/admin/album/kaydet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          baslik,
          kapakMediaId: kapak,
          fotograflar: fotolar.map((f, i) => ({
            media_id: f.media_id,
            bolum: f.bolum,
            sira: i,
          })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.hata ?? "Kaydedilemedi.");
      bildir("Kaydedildi.");
      return true;
    } catch (err) {
      setHata(err instanceof Error ? err.message : "Bir hata oluştu.");
      return false;
    } finally {
      setIslem(null);
    }
  }

  async function yayinDegistir(yayinla: boolean) {
    if (islem) return;
    if (yayinla) {
      const ok = await kaydet();
      if (!ok) return;
    }
    setIslem("yayin");
    setHata(null);
    try {
      const res = await fetch("/api/admin/album/yayinla", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, yayinla }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.hata ?? "Güncellenemedi.");
      setDurum(yayinla ? "yayinda" : "taslak");
      if (data.slug) setSlug(data.slug);
      bildir(yayinla ? "Yayınlandı." : "Taslağa alındı.");
    } catch (err) {
      setHata(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setIslem(null);
    }
  }

  function paylasimKopyala() {
    if (!slug) return;
    const url = `${window.location.origin}/album/${slug}`;
    navigator.clipboard?.writeText(url).then(
      () => bildir("Paylaşım linki kopyalandı."),
      () => bildir(url),
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href="/admin/album"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Albümler
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">{eventTitle}</h1>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                durum === "yayinda" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
              }`}
            >
              {durum === "yayinda" ? "Yayında" : "Taslak"}
            </span>
            <span className="text-xs text-muted-foreground">
              {paketEtiket(paket)} · {fotolar.length} fotoğraf
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {durum === "yayinda" && slug && (
            <>
              <button
                type="button"
                onClick={paylasimKopyala}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-xs font-medium text-foreground/70 hover:border-primary hover:text-primary-deep"
              >
                <Link2 className="h-3.5 w-3.5" /> Linki kopyala
              </button>
              <Link
                href={`/album/${slug}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-xs font-medium text-foreground/70 hover:border-primary hover:text-primary-deep"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Gör
              </Link>
            </>
          )}
        </div>
      </div>

      {mesaj && (
        <p className="mt-4 inline-flex items-center gap-1.5 rounded-2xl bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="h-4 w-4" /> {mesaj}
        </p>
      )}
      {hata && (
        <p className="mt-4 rounded-2xl bg-rose-soft px-4 py-3 text-sm font-medium text-rose">{hata}</p>
      )}

      <label className="mt-5 block">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Albüm Başlığı
        </span>
        <input
          value={baslik}
          onChange={(e) => setBaslik(e.target.value)}
          className="mt-1.5 w-full max-w-md rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
        />
      </label>

      {/* Aksiyonlar */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={kaydet}
          disabled={!!islem}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 disabled:opacity-60"
        >
          {islem === "kaydet" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Kaydet
        </button>
        <a
          href={`/api/admin/album/pdf?id=${id}`}
          className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground/70 transition-colors hover:border-primary hover:text-primary-deep"
        >
          <FileDown className="h-4 w-4" /> PDF Oluştur
        </a>
        <button
          type="button"
          onClick={() => setHavuzAcik((v) => !v)}
          className="inline-flex items-center gap-2 rounded-full border border-primary/40 px-5 py-2.5 text-sm font-semibold text-primary-deep transition-colors hover:bg-primary-soft/50"
        >
          <Plus className="h-4 w-4" /> Fotoğraf ekle ({havuz.length})
        </button>
        {durum === "yayinda" ? (
          <button
            type="button"
            onClick={() => yayinDegistir(false)}
            disabled={!!islem}
            className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground/70 transition-colors hover:border-foreground hover:text-foreground disabled:opacity-60"
          >
            {islem === "yayin" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Undo2 className="h-4 w-4" />}
            Taslağa al
          </button>
        ) : (
          <button
            type="button"
            onClick={() => yayinDegistir(true)}
            disabled={!!islem}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-60"
          >
            {islem === "yayin" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
            Yayınla
          </button>
        )}
      </div>

      {/* Havuz */}
      {havuzAcik && (
        <div className="mt-5 rounded-2xl border border-border bg-card p-4">
          <p className="mb-3 text-sm font-medium">Havuz — eklemek için bir fotoğrafa dokunun</p>
          {havuz.length === 0 ? (
            <p className="text-sm text-muted-foreground">Eklenecek başka fotoğraf yok.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {havuz.map((h) => (
                <button
                  key={h.media_id}
                  type="button"
                  onClick={() => havuzdanEkle(h)}
                  className="relative aspect-square overflow-hidden rounded-lg border border-border hover:ring-2 hover:ring-primary/40"
                >
                  {h.url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={h.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                  )}
                  <span className="absolute right-1 top-1 rounded-full bg-primary p-0.5 text-primary-foreground">
                    <Plus className="h-3 w-3" />
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Albüm ızgarası (sürükle-bırak) */}
      {fotolar.length === 0 ? (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Albümde fotoğraf yok. Havuzdan ekleyin.
        </p>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {fotolar.map((f, i) => (
            <div
              key={f.media_id}
              draggable
              onDragStart={() => (surukle.current = i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => birak(i)}
              className={`overflow-hidden rounded-2xl border bg-card ${
                kapak === f.media_id ? "border-primary ring-2 ring-primary/30" : "border-border"
              }`}
            >
              <div className="relative aspect-square bg-muted">
                {f.url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                )}
                <span className="absolute left-1 top-1 cursor-grab rounded-md bg-black/45 p-1 text-white">
                  <GripVertical className="h-3.5 w-3.5" />
                </span>
                <span className="absolute left-1 bottom-1 rounded-full bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  #{i + 1}
                </span>
                <div className="absolute right-1 top-1 flex gap-1">
                  <button
                    type="button"
                    onClick={() => setKapak(f.media_id)}
                    title="Kapak yap"
                    className={`rounded-full p-1 ${
                      kapak === f.media_id ? "bg-primary text-primary-foreground" : "bg-black/45 text-white"
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
                  value={f.bolum ?? "Diğer"}
                  onChange={(e) => bolumDegistir(i, e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary"
                >
                  {BOLUM_DUZEN.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
