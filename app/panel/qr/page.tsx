"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Download, Link2, Palette, Check } from "lucide-react";
import { etkinlikler } from "@/lib/mock-data";

const renkSecenekleri = [
  { ad: "Şampanya", fg: "#9c7740", bg: "#ffffff" },
  { ad: "Antrasit", fg: "#2b2521", bg: "#ffffff" },
  { ad: "Gül", fg: "#b06a73", bg: "#fdf6f4" },
  { ad: "Gece", fg: "#ffffff", bg: "#2b2521" },
];

type CerceveStil = "klasik" | "altin" | "minimal";

const cerceveler: { id: CerceveStil; ad: string }[] = [
  { id: "klasik", ad: "Klasik" },
  { id: "altin", ad: "Altın Çerçeve" },
  { id: "minimal", ad: "Minimal" },
];

export default function QrPage() {
  const [slug, setSlug] = useState(etkinlikler[0]?.slug ?? "");
  const [renk, setRenk] = useState(renkSecenekleri[0]);
  const [cerceve, setCerceve] = useState<CerceveStil>("altin");
  const [dataUrl, setDataUrl] = useState("");
  const [origin, setOrigin] = useState("");

  const etkinlik =
    etkinlikler.find((e) => e.slug === slug) ?? etkinlikler[0];
  const hedefUrl = origin ? `${origin}/e/${slug}` : `/e/${slug}`;

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    QRCode.toDataURL(hedefUrl, {
      width: 600,
      margin: 1,
      color: { dark: renk.fg, light: renk.bg },
      errorCorrectionLevel: "H",
    })
      .then(setDataUrl)
      .catch(() => setDataUrl(""));
  }, [hedefUrl, renk]);

  async function kartIndir() {
    if (!etkinlik || !dataUrl) return;
    const canvas = document.createElement("canvas");
    const W = 1080;
    const H = 1350;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Zemin
    ctx.fillStyle = "#faf7f2";
    ctx.fillRect(0, 0, W, H);

    // Altın çerçeve
    if (cerceve !== "minimal") {
      ctx.strokeStyle = cerceve === "altin" ? "#b8915a" : "#e0d5c2";
      ctx.lineWidth = cerceve === "altin" ? 14 : 6;
      ctx.strokeRect(60, 60, W - 120, H - 120);
    }

    // Başlık
    ctx.fillStyle = "#2b2521";
    ctx.textAlign = "center";
    ctx.font = "600 64px Georgia, serif";
    ctx.fillText(etkinlik.title, W / 2, 230);

    ctx.fillStyle = "#9c7740";
    ctx.font = "30px Arial";
    ctx.fillText("Anılarınızı bizimle paylaşın", W / 2, 290);

    // QR
    const qr = new Image();
    qr.crossOrigin = "anonymous";
    await new Promise<void>((resolve) => {
      qr.onload = () => resolve();
      qr.src = dataUrl;
    });
    const qrBoyut = 620;
    ctx.drawImage(qr, (W - qrBoyut) / 2, 360, qrBoyut, qrBoyut);

    // Alt metin
    ctx.fillStyle = "#2b2521";
    ctx.font = "600 40px Arial";
    ctx.fillText("QR Kodu Okutun", W / 2, 1120);
    ctx.fillStyle = "#8c8175";
    ctx.font = "26px Arial";
    ctx.fillText("Uygulama indirmeden saniyeler içinde", W / 2, 1170);
    ctx.fillText("fotoğraf, video ve anılarınızı yükleyin", W / 2, 1210);

    ctx.fillStyle = "#b8915a";
    ctx.font = "italic 24px Georgia, serif";
    ctx.fillText("WeddinAI", W / 2, 1280);

    const link = document.createElement("a");
    link.download = `${slug}-qr-kart.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  if (!etkinlik) {
    return (
      <div className="mx-auto max-w-6xl">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          QR Tasarım Motoru
        </h1>
        <div className="mt-8 flex flex-col items-center justify-center rounded-3xl border border-dashed border-primary/30 bg-card/60 px-6 py-20 text-center">
          <p className="text-sm text-muted-foreground">
            QR kodu oluşturmak için önce bir etkinlik ekleyin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="font-display text-2xl font-semibold tracking-tight">
        QR Tasarım Motoru
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Etkinliğinizin QR kodunu özelleştirin, baskıya hazır kart olarak indirin.
      </p>

      <div className="mt-7 grid gap-8 lg:grid-cols-[1fr_420px]">
        {/* Sol: ayarlar */}
        <div className="space-y-6">
          {/* Etkinlik seçimi */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display flex items-center gap-2 text-lg font-semibold">
              <Link2 className="h-5 w-5 text-primary" /> Etkinlik
            </h2>
            <div className="mt-4 space-y-2">
              {etkinlikler.map((e) => (
                <button
                  key={e.id}
                  onClick={() => setSlug(e.slug)}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                    slug === e.slug
                      ? "border-primary bg-primary-soft/40"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <span className="font-medium">{e.title}</span>
                  {slug === e.slug && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </button>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-muted px-4 py-3 text-xs text-muted-foreground">
              <Link2 className="h-3.5 w-3.5" />
              <span className="truncate">{hedefUrl}</span>
            </div>
          </div>

          {/* Renk */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display flex items-center gap-2 text-lg font-semibold">
              <Palette className="h-5 w-5 text-primary" /> Renk Paleti
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {renkSecenekleri.map((r) => (
                <button
                  key={r.ad}
                  onClick={() => setRenk(r)}
                  className={`rounded-xl border p-3 text-center transition-all ${
                    renk.ad === r.ad
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <span
                    className="mx-auto block h-10 w-10 rounded-lg border border-border"
                    style={{ background: r.bg }}
                  >
                    <span
                      className="block h-full w-full scale-50 rounded"
                      style={{ background: r.fg }}
                    />
                  </span>
                  <span className="mt-2 block text-xs font-medium">{r.ad}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Çerçeve */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-lg font-semibold">Çerçeve Stili</h2>
            <div className="mt-4 flex gap-3">
              {cerceveler.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCerceve(c.id)}
                  className={`flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                    cerceve === c.id
                      ? "border-primary bg-primary-soft/40 text-foreground"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {c.ad}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sağ: canlı önizleme */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="mb-4 text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Canlı Önizleme
            </p>
            <div
              className={`mx-auto flex max-w-[320px] flex-col items-center rounded-2xl bg-background px-6 py-8 text-center ${
                cerceve === "altin"
                  ? "border-[6px] border-primary"
                  : cerceve === "klasik"
                    ? "border-2 border-border"
                    : ""
              }`}
            >
              <h3 className="font-display text-xl font-semibold">
                {etkinlik.title}
              </h3>
              <p className="mt-1 text-xs text-[#9c7740]">
                Anılarınızı bizimle paylaşın
              </p>
              {dataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={dataUrl}
                  alt="QR kod"
                  className="mt-5 h-52 w-52 rounded-lg"
                />
              ) : (
                <div className="mt-5 h-52 w-52 animate-pulse rounded-lg bg-muted" />
              )}
              <p className="mt-5 text-sm font-semibold">QR Kodu Okutun</p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                Uygulama indirmeden saniyeler içinde fotoğraf ve videolarınızı
                yükleyin
              </p>
              <p className="font-display mt-3 text-xs italic text-primary">
                WeddinAI
              </p>
            </div>

            <button
              onClick={kartIndir}
              disabled={!dataUrl}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground shadow-elegant transition-all hover:brightness-110 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Baskıya Hazır Kartı İndir (PNG)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
