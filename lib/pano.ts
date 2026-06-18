// =============================================================
// Panoya kopyalama — her cihazda / tarayıcıda çalışır.
// 1) navigator.clipboard.writeText (yalnızca güvenli bağlam: HTTPS / localhost)
// 2) Fallback: gizli textarea seç + document.execCommand("copy")
//    (iOS Safari, eski Android, Samsung Internet, Edge Mobile, in-app webview)
// Başarı/başarısızlıkta zarif bir toast gösterir.
//
// NOT: Bu fonksiyon mutlaka bir kullanıcı etkileşimi (onClick) içinde
// çağrılmalı; aksi halde tarayıcılar pano erişimini engeller.
// =============================================================

// Senkron DOM fallback — kullanıcı hareketini (user activation) kaybetmeden
// çalışır. Clipboard API başarısız olduğunda devreye girer.
function execCommandKopya(metin: string): boolean {
  try {
    const ta = document.createElement("textarea");
    ta.value = metin;
    ta.setAttribute("readonly", "");
    // Ekran dışına değil; görünmez ama seçilebilir bir konuma yerleştir.
    ta.style.position = "fixed";
    ta.style.top = "0";
    ta.style.left = "0";
    ta.style.width = "1px";
    ta.style.height = "1px";
    ta.style.padding = "0";
    ta.style.border = "none";
    ta.style.outline = "none";
    ta.style.boxShadow = "none";
    ta.style.background = "transparent";
    ta.style.opacity = "0";
    // iOS'ta otomatik yakınlaştırmayı önle.
    ta.style.fontSize = "16px";
    document.body.appendChild(ta);

    const aktifEleman = document.activeElement as HTMLElement | null;
    const iOS = /ipad|iphone|ipod/i.test(navigator.userAgent);

    if (iOS) {
      // iOS Safari: select() çalışmaz → Range ile seç.
      const range = document.createRange();
      range.selectNodeContents(ta);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
      ta.setSelectionRange(0, metin.length);
    } else {
      ta.focus();
      ta.select();
    }

    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    // Önceki odağı geri ver (sayfa kaymasın / klavye açılmasın).
    aktifEleman?.focus?.();
    return ok;
  } catch {
    return false;
  }
}

export async function panoyaKopyala(metin: string): Promise<boolean> {
  if (typeof window === "undefined" || !metin) return false;

  // 1) Modern Clipboard API — yalnızca güvenli bağlamda (HTTPS/localhost).
  //    Reddederse senkron fallback'e düş.
  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === "function" &&
    window.isSecureContext
  ) {
    try {
      await navigator.clipboard.writeText(metin);
      return true;
    } catch {
      // Pano izni reddedildi / odak yok → klasik yönteme geç.
    }
  }

  // 2) Klasik fallback (her yerde).
  return execCommandKopya(metin);
}

// Hafif, çerçeveden bağımsız toast — body'ye eklenir, kendiliğinden kaybolur.
export function bildir(mesaj: string, tip: "ok" | "hata" = "ok"): void {
  if (typeof document === "undefined") return;
  const el = document.createElement("div");
  el.textContent = mesaj;
  el.setAttribute("role", "status");
  el.setAttribute("aria-live", "polite");
  el.className = `wa-toast wa-toast-${tip}`;
  document.body.appendChild(el);
  // bir sonraki frame'de göster (geçiş animasyonu için)
  requestAnimationFrame(() => el.classList.add("wa-toast-acik"));
  window.setTimeout(() => {
    el.classList.remove("wa-toast-acik");
    window.setTimeout(() => el.remove(), 320);
  }, 2200);
}

// Kopyala + bildir tek adımda.
export async function kopyalaVeBildir(
  metin: string,
  basari = "Link kopyalandı",
  hata = "Kopyalanamadı — linki uzun basıp seçin",
): Promise<boolean> {
  const ok = await panoyaKopyala(metin);
  bildir(ok ? basari : hata, ok ? "ok" : "hata");
  return ok;
}
