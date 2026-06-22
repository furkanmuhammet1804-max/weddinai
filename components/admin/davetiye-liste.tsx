"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Heart,
  Phone,
  Mail,
  MessageCircle,
  Loader2,
  ExternalLink,
  Rocket,
  Link2,
  CalendarHeart,
  Copy,
  Palette,
  Trash2,
} from "lucide-react";
import type { Davetiye } from "@/lib/davetiye";
import { temaBul } from "@/lib/davetiye-tema";
import { kopyalaVeBildir, bildir } from "@/lib/pano";

// Kopyalanan davetiye linki daima kanonik üretim alanını gösterir
// (admin vercel önizleme alanından açılsa bile doğru link paylaşılır).
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.weddinai.com"
).replace(/\/+$/, "");

// (Sunucu modülünü client'a çekmemek için durumlar burada da tanımlı.)
const DURUMLAR: { id: string; etiket: string; sinif: string }[] = [
  { id: "talep_alindi", etiket: "Talep Alındı", sinif: "bg-muted text-foreground/70" },
  { id: "odeme_bekleniyor", etiket: "Ödeme Bekleniyor", sinif: "bg-amber-100 text-amber-700" },
  { id: "odeme_onaylandi", etiket: "Ödeme Onaylandı", sinif: "bg-sky-100 text-sky-700" },
  { id: "tasarim_hazirlaniyor", etiket: "Tasarım Hazırlanıyor", sinif: "bg-violet-100 text-violet-700" },
  { id: "musteri_onayi", etiket: "Müşteri Onayı Bekleniyor", sinif: "bg-orange-100 text-orange-700" },
  { id: "yayinda", etiket: "Yayında", sinif: "bg-emerald-100 text-emerald-700" },
  { id: "tamamlandi", etiket: "Tamamlandı", sinif: "bg-primary-soft text-primary-deep" },
  { id: "iptal", etiket: "İptal", sinif: "bg-rose-soft text-rose" },
];

function waLink(phone: string): string {
  const t = phone.replace(/[^0-9]/g, "");
  return `https://wa.me/${t.startsWith("0") ? "9" + t : t}`;
}
const kisaNo = (id: string) => id.slice(0, 8).toUpperCase();
const tarih = (s: string | null) =>
  s ? new Date(s).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export function DavetiyeListe({ davetiyeler }: { davetiyeler: Davetiye[] }) {
  return (
    <div className="mx-auto max-w-4xl">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Davetiye Talepleri
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Dijital davetiye talepleri. Durumu yönet, slug belirle ve yayına al.
        </p>
      </div>

      {davetiyeler.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-border bg-card/50 p-14 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Heart className="h-8 w-8" />
          </div>
          <h3 className="font-display mt-5 text-xl font-semibold">Henüz davetiye talebi yok</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            /davetiye/talep formundan gelen talepler burada listelenir.
          </p>
        </div>
      ) : (
        <div className="mt-7 space-y-3">
          {davetiyeler.map((d) => (
            <DavetiyeKart key={d.id} d={d} />
          ))}
        </div>
      )}
    </div>
  );
}

function DavetiyeKart({ d }: { d: Davetiye }) {
  const router = useRouter();
  const [durum, setDurum] = useState<string>(d.durum);
  const [slug, setSlug] = useState(d.slug ?? "");
  const [kaydediyor, setKaydediyor] = useState(false);
  const [mesaj, setMesaj] = useState<string | null>(null);
  const [manuelUrl, setManuelUrl] = useState<string | null>(null);
  const [siliniyor, setSiliniyor] = useState(false);

  async function gonder(body: Record<string, unknown>): Promise<{ ok: boolean; slug?: string; hata?: string }> {
    setKaydediyor(true);
    setMesaj(null);
    try {
      const res = await fetch("/api/admin/davetiye", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: d.id, ...body }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) return { ok: false, hata: j.hata ?? "Hata" };
      router.refresh();
      return { ok: true, slug: j.slug };
    } finally {
      setKaydediyor(false);
    }
  }

  async function durumDegistir(yeni: string) {
    if (yeni === durum) return;
    const eski = durum;
    setDurum(yeni);
    const r = await gonder({ durum: yeni });
    if (!r.ok) { setDurum(eski); setMesaj(r.hata ?? null); }
    else if (r.slug) setSlug(r.slug);
  }
  async function yayinla() {
    const r = await gonder({ durum: "yayinda" });
    if (r.ok) { setDurum("yayinda"); if (r.slug) setSlug(r.slug); }
    else setMesaj(r.hata ?? null);
  }
  async function slugKaydet() {
    if (!slug.trim()) return;
    const r = await gonder({ slug: slug.trim() });
    if (!r.ok) setMesaj(r.hata ?? null);
    else if (r.slug) setSlug(r.slug);
  }

  // Davetiye linkini panoya kopyala — açık hata ayıklama + slug guard +
  // garantili fallback (kopyalaVeBildir içinde clipboard API + execCommand).
  // Programatik kopya engellenirse seçilebilir URL alanı gösterilir (manuel).
  async function linkiKopyala() {
    const temizSlug = slug.trim();
    if (!temizSlug) {
      bildir("Önce bir bağlantı adı (slug) belirleyin.", "hata");
      return;
    }
    const url = `${SITE_URL}/davetiye/${temizSlug}`;
    let ok = false;
    try {
      ok = await kopyalaVeBildir(url, "Link kopyalandı");
    } catch (e) {
      console.error("[davetiye] kopya hatası:", e);
    }
    // Başarısızsa manuel kopyalama için seçilebilir alanı aç.
    setManuelUrl(ok ? null : url);
  }

  // Davetiyeyi kalıcı sil — yanlışlıkla silmeyi önlemek için "SİL" yazma onayı.
  async function sil() {
    if (siliniyor || kaydediyor) return;
    const onay = window.prompt(
      `"${d.gelin_ad} & ${d.damat_ad}" davetiyesini ve tüm fotoğraf/müzik dosyalarını kalıcı olarak silmek üzeresiniz. Bu işlem geri ALINAMAZ.\n\nOnaylamak için SİL yazın:`,
    );
    if ((onay ?? "").trim().toLocaleUpperCase("tr") !== "SİL") return;
    setSiliniyor(true);
    try {
      const res = await fetch("/api/admin/davetiye-sil", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: d.id }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setSiliniyor(false);
      window.alert("Davetiye silinemedi. Lütfen tekrar deneyin.");
    }
  }

  const rozet = DURUMLAR.find((x) => x.id === durum) ?? DURUMLAR[0];
  const etkinlikler = Array.isArray(d.etkinlikler) ? d.etkinlikler : [];
  const yayinda = durum === "yayinda";

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-lg font-semibold">
              {d.gelin_ad} <span className="font-display italic text-primary">&</span> {d.damat_ad}
            </h3>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${rozet.sinif}`}>{rozet.etiket}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-medium text-primary-deep">
              <Palette className="h-3 w-3" /> {temaBul(d.tema).ad}
            </span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-mono text-muted-foreground">#{kisaNo(d.id)}</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {etkinlikler.length} etkinlik · {tarih(d.created_at)} talebi
          </p>
        </div>
        <div className="flex items-center gap-2">
          {kaydediyor && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          <select
            value={durum}
            onChange={(e) => durumDegistir(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          >
            {DURUMLAR.map((x) => <option key={x.id} value={x.id}>{x.etiket}</option>)}
          </select>
          <button
            type="button"
            onClick={sil}
            disabled={siliniyor || kaydediyor}
            title="Davetiyeyi sil"
            aria-label="Davetiyeyi sil"
            className="inline-flex items-center justify-center rounded-xl border border-border px-2.5 py-2 text-muted-foreground transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          >
            {siliniyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Etkinlik özeti */}
      {etkinlikler.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {etkinlikler.map((e, i) => (
            <span key={i} className="inline-flex items-center gap-1 rounded-lg bg-muted/60 px-2 py-1 text-xs text-foreground/80">
              <CalendarHeart className="h-3 w-3" /> {e.tur}{e.tarih ? ` · ${e.tarih}` : ""}
            </span>
          ))}
        </div>
      )}

      {/* Slug + yayın */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center overflow-hidden rounded-full border border-border">
          <span className="px-3 py-1.5 text-xs text-muted-foreground">/davetiye/</span>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="ayse-mehmet"
            className="w-36 bg-background px-2 py-1.5 text-sm outline-none"
          />
          <button type="button" onClick={slugKaydet} disabled={kaydediyor} title="Bağlantı adını kaydet" aria-label="Bağlantı adını kaydet" className="border-l border-border px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-50">
            <Link2 className="h-3.5 w-3.5" />
          </button>
        </div>
        {!yayinda ? (
          <button type="button" onClick={yayinla} disabled={kaydediyor} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground hover:brightness-110 disabled:opacity-60">
            <Rocket className="h-3.5 w-3.5" /> Yayınla
          </button>
        ) : (
          <>
            <a href={`/davetiye/${slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 px-3.5 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50">
              <ExternalLink className="h-3.5 w-3.5" /> Davetiyeyi Aç
            </a>
            <button
              type="button"
              onClick={linkiKopyala}
              title="Davetiye linkini kopyala"
              aria-label="Davetiye linkini kopyala"
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-sm font-medium hover:border-primary hover:text-primary"
            >
              <Copy className="h-3.5 w-3.5" /> Linki Kopyala
            </button>
            <button type="button" onClick={() => durumDegistir("tasarim_hazirlaniyor")} disabled={kaydediyor} className="rounded-full border border-border px-3.5 py-1.5 text-sm font-medium hover:border-rose hover:text-rose disabled:opacity-60">
              Yayından kaldır
            </button>
          </>
        )}
      </div>

      {mesaj && <p className="mt-2 text-xs font-medium text-rose">{mesaj}</p>}

      {/* Programatik kopya engellenirse: linki elle seç-kopyala */}
      {manuelUrl && (
        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2">
          <span className="text-xs font-medium text-amber-700">
            Otomatik kopyalama engellendi — linki seçip kopyalayın:
          </span>
          <input
            readOnly
            value={manuelUrl}
            onFocus={(e) => e.currentTarget.select()}
            ref={(el) => {
              if (el) {
                el.focus();
                el.select();
              }
            }}
            className="min-w-0 flex-1 rounded-lg border border-amber-300 bg-white px-2 py-1 text-xs text-foreground outline-none"
          />
          <button
            type="button"
            onClick={() => setManuelUrl(null)}
            className="text-xs font-medium text-amber-700 underline"
          >
            Kapat
          </button>
        </div>
      )}

      {/* İletişim */}
      <div className="mt-4 flex flex-wrap gap-2">
        {d.phone && (
          <>
            <a href={`tel:${d.phone}`} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-sm font-medium hover:border-primary hover:text-primary"><Phone className="h-3.5 w-3.5" /> {d.phone}</a>
            <a href={waLink(d.phone)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 px-3.5 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50"><MessageCircle className="h-3.5 w-3.5" /> WhatsApp</a>
          </>
        )}
        {d.email && <a href={`mailto:${d.email}`} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-sm font-medium hover:border-primary hover:text-primary"><Mail className="h-3.5 w-3.5" /> {d.email}</a>}
      </div>

      {d.notlar && <p className="mt-3 rounded-xl bg-muted/60 px-3 py-2 text-sm text-foreground/80">{d.notlar}</p>}
    </div>
  );
}
