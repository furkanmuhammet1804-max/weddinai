// =============================================================
// Panoya kopyalama — her cihazda çalışır.
// 1) navigator.clipboard (yalnızca secure context: HTTPS / localhost)
// 2) Fallback: textarea + document.execCommand("copy") (iOS Safari dahil)
// Başarı/başarısızlıkta zarif bir toast gösterir.
// =============================================================

export async function panoyaKopyala(metin: string): Promise<boolean> {
  if (typeof window === "undefined" || !metin) return false;

  // 1) Modern Clipboard API — yalnızca güvenli bağlamda kullanılabilir.
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(metin);
      return true;
    }
  } catch {
    /* fallback'e düş */
  }

  // 2) Klasik fallback — textarea seç + execCommand.
  try {
    const ta = document.createElement("textarea");
    ta.value = metin;
    ta.setAttribute("readonly", "");
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
    document.body.appendChild(ta);

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
    return ok;
  } catch {
    return false;
  }
}

// Hafif, çerçeveden bağımsız toast — body'ye eklenir, kendiliğinden kaybolur.
export function bildir(mesaj: string, tip: "ok" | "hata" = "ok"): void {
  if (typeof document === "undefined") return;
  const el = document.createElement("div");
  el.textContent = mesaj;
  el.setAttribute("role", "status");
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
