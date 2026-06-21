"use client";

// Admin — Hatıra Defteri editörü (Özellik 3). İçeriği düzenle, kaydet,
// AI ile yeniden üret, yayınla/taslağa al. Otomatik yayın YOK.
import { useState } from "react";
import Link from "next/link";
import {
  Save,
  Sparkles,
  Loader2,
  Globe,
  Undo2,
  ExternalLink,
  ArrowLeft,
  CheckCircle2,
  FileDown,
} from "lucide-react";

interface Props {
  id: string;
  eventId: string;
  baslikIlk: string;
  icerikIlk: string;
  durumIlk: string;
  slugIlk: string | null;
  eventTitle: string;
}

export function HatiraEditor({
  id,
  eventId,
  baslikIlk,
  icerikIlk,
  durumIlk,
  slugIlk,
  eventTitle,
}: Props) {
  const [baslik, setBaslik] = useState(baslikIlk);
  const [icerik, setIcerik] = useState(icerikIlk);
  const [durum, setDurum] = useState(durumIlk);
  const [slug, setSlug] = useState(slugIlk);
  const [mesaj, setMesaj] = useState<string | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [islem, setIslem] = useState<null | "kaydet" | "uret" | "yayin">(null);

  function bildir(m: string) {
    setMesaj(m);
    setTimeout(() => setMesaj((x) => (x === m ? null : x)), 2500);
  }

  async function kaydet() {
    if (islem) return;
    setIslem("kaydet");
    setHata(null);
    try {
      const res = await fetch("/api/admin/hatira/kaydet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, baslik, icerik }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.hata ?? "Kaydedilemedi.");
      bildir("Kaydedildi.");
    } catch (err) {
      setHata(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setIslem(null);
    }
  }

  async function yenidenUret() {
    if (islem) return;
    if (!confirm("Mevcut içerik AI tarafından yeniden üretilen taslakla değiştirilecek. Devam edilsin mi?"))
      return;
    setIslem("uret");
    setHata(null);
    try {
      const res = await fetch("/api/admin/hatira/uret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.hata ?? "Üretilemedi.");
      // Taslak DB'de güncellendi; en güncel içeriği almak için sayfayı tazele.
      window.location.reload();
    } catch (err) {
      setHata(err instanceof Error ? err.message : "Bir hata oluştu.");
      setIslem(null);
    }
  }

  async function yayinDegistir(yayinla: boolean) {
    if (islem) return;
    setIslem("yayin");
    setHata(null);
    try {
      // Yayınlamadan önce mevcut düzenlemeyi kaydet.
      if (yayinla) {
        await fetch("/api/admin/hatira/kaydet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, baslik, icerik }),
        });
      }
      const res = await fetch("/api/admin/hatira/yayinla", {
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

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/admin/hatira"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Hatıra Defterleri
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            {eventTitle}
          </h1>
          <span
            className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              durum === "yayinda"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {durum === "yayinda" ? "Yayında" : "Taslak"}
          </span>
        </div>
        {durum === "yayinda" && slug && (
          <Link
            href={`/hatira/${slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-xs font-medium text-foreground/70 hover:border-primary hover:text-primary-deep"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Yayını gör
          </Link>
        )}
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

      <div className="mt-5 space-y-4">
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Başlık
          </span>
          <input
            value={baslik}
            onChange={(e) => setBaslik(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
          />
        </label>

        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            İçerik
          </span>
          <textarea
            value={icerik}
            onChange={(e) => setIcerik(e.target.value)}
            rows={20}
            className="mt-1.5 w-full resize-y rounded-xl border border-border bg-background px-4 py-3 font-mono text-sm leading-relaxed outline-none focus:border-primary"
          />
        </label>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
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
          href={`/api/admin/hatira/pdf?id=${id}`}
          className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground/70 transition-colors hover:border-primary hover:text-primary-deep"
        >
          <FileDown className="h-4 w-4" /> PDF Oluştur
        </a>

        <button
          type="button"
          onClick={yenidenUret}
          disabled={!!islem}
          className="inline-flex items-center gap-2 rounded-full border border-primary/40 px-5 py-2.5 text-sm font-semibold text-primary-deep transition-colors hover:bg-primary-soft/50 disabled:opacity-60"
        >
          {islem === "uret" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          AI ile yeniden üret
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
    </div>
  );
}
