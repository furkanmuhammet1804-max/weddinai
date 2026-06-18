// Bir Blob'u dosya olarak indirir.
//
// Önemli: URL.revokeObjectURL'i a.click()'ten hemen sonra çağırmak mobil
// Safari (ve bazen Chrome) üzerinde indirmeyi daha başlamadan iptal eder.
// Bu yüzden iptali geciktiriyoruz; tarayıcı indirmeyi başlatacak vakti bulur.
export function blobIndir(blob: Blob, dosyaAdi: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = dosyaAdi;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

// Çok sayıda (ve büyük) medya için ZIP. Fotoğraf/video zaten sıkıştırılmış
// olduğundan STORE kullanıyoruz: CPU ve bellek baskısını azaltır, mobilde
// çökme riskini düşürür. (Yalnızca showroom istemci-taraflı indirmede.)
export const ZIP_AYAR = { type: "blob", compression: "STORE" } as const;

// Sunucu-taraflı ZIP'i gizli form + gizli iframe ile POST edip indirir.
// Bu yöntem tek dosyalık (attachment) indirme için tüm tarayıcılarda,
// özellikle iOS Safari'de, en güvenilir olanıdır: Blob/bellek yok, popup yok,
// kullanıcı jesti içinde çalışır, sayfadan ayrılmaz (iframe hedefi).
export function formIleIndir(action: string, alanlar: Record<string, string>) {
  const FRAME = "weddinai_indir_frame";
  let iframe = document.getElementById(FRAME) as HTMLIFrameElement | null;
  if (!iframe) {
    iframe = document.createElement("iframe");
    iframe.id = FRAME;
    iframe.name = FRAME;
    iframe.style.display = "none";
    document.body.appendChild(iframe);
  }
  const form = document.createElement("form");
  form.method = "POST";
  form.action = action;
  form.target = FRAME;
  form.style.display = "none";
  for (const [k, v] of Object.entries(alanlar)) {
    const inp = document.createElement("input");
    inp.type = "hidden";
    inp.name = k;
    inp.value = v;
    form.appendChild(inp);
  }
  document.body.appendChild(form);
  form.submit();
  setTimeout(() => form.remove(), 2000);
}
