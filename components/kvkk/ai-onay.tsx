"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";

function tarihTR(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export function AiOnayKutusu({
  token,
  zatenOnayli,
  onayTarihi,
}: {
  token: string;
  // Ziyaretten ÖNCE bu oda zaten onaylı mıydı (server'dan gelir, salt okunur).
  zatenOnayli: boolean;
  onayTarihi: string | null;
}) {
  // Yalnızca bu oturumda kullanıcı "Onaylıyorum"a basıp POST başarılı olunca true.
  // Link girişinde ASLA otomatik true olmaz.
  const [yeniOnaylandi, setYeniOnaylandi] = useState(false);
  const [tarih, setTarih] = useState<string | null>(null);
  const [kabul, setKabul] = useState(false);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  async function onayla() {
    if (gonderiliyor || !kabul) return;
    setGonderiliyor(true);
    setHata(null);
    try {
      const res = await fetch("/api/ai-onay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.hata ?? "Onay kaydedilemedi.");
      setTarih(new Date().toISOString());
      setYeniOnaylandi(true);
    } catch (err) {
      setHata(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setGonderiliyor(false);
    }
  }

  // 1) Bu oturumda yeni onay verildi → teşekkür ekranı.
  if (yeniOnaylandi) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
        <CheckCircle2 className="mx-auto h-9 w-9 text-emerald-600" />
        <p className="font-display mt-2 text-lg font-semibold text-emerald-800">
          Onayınız alındı 💛
        </p>
        <p className="mt-1 text-sm text-emerald-700">
          Teşekkürler. Fotoğraflar artık otomatik düzenlenebilir.
          {tarih ? ` (${tarihTR(tarih)})` : ""}
        </p>
      </div>
    );
  }

  // 2) Ziyaretten ÖNCE zaten onaylanmış → bilgilendirme (otomatik onay DEĞİL).
  if (zatenOnayli) {
    return (
      <div className="rounded-2xl border border-border bg-muted/40 p-5 text-center">
        <ShieldCheck className="mx-auto h-9 w-9 text-muted-foreground" />
        <p className="font-display mt-2 text-lg font-semibold text-foreground">
          Bu oda için daha önce onay verilmiştir.
        </p>
        {onayTarihi ? (
          <p className="mt-1 text-sm text-muted-foreground">
            Onay tarihi: {tarihTR(onayTarihi)}
          </p>
        ) : null}
      </div>
    );
  }

  // 3) İlk giriş / onaysız → KVKK açık rıza formu (varsayılan: onay YOK).
  return (
    <div>
      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-background p-4">
        <input
          type="checkbox"
          checked={kabul}
          onChange={(e) => setKabul(e.target.checked)}
          className="mt-0.5 h-5 w-5 accent-primary"
        />
        <span className="text-sm text-foreground/80">
          Yukarıdaki KVKK aydınlatma metnini okudum; fotoğraflarda{" "}
          <strong>yüz sayısı tespiti</strong> yapılarak medyanın otomatik
          düzenlenmesine <strong>açık rıza</strong> veriyorum.
        </span>
      </label>

      {hata && (
        <p className="mt-3 rounded-xl bg-rose-soft px-4 py-2.5 text-sm font-medium text-rose">
          {hata}
        </p>
      )}

      <button
        type="button"
        onClick={onayla}
        disabled={!kabul || gonderiliyor}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-elegant transition-all hover:brightness-110 disabled:opacity-50"
      >
        {gonderiliyor ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ShieldCheck className="h-4 w-4" />
        )}
        Onaylıyorum
      </button>
    </div>
  );
}
