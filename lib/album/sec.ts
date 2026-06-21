// =============================================================
// AI ALBÜM SEÇİM MANTIĞI (Özellik 5) — saf fonksiyon, DB'siz.
// F4 analiz verisinden en iyi kareleri seçer:
//   1) kalitesiz (bulanık/karanlık) ele
//   2) tekrar/benzer ele (grup başına en iyi)
//   3) kategori dengesi (round-robin)
//   4) hikâye akışına göre bölümle ve sırala
// =============================================================
import { gruplaBenzer, type HamAnaliz } from "@/lib/medya/veri";
import { BOLUM_DUZEN, bolumIcin } from "@/lib/album/sabit";

export interface AlbumSecim {
  media_id: string;
  bolum: string;
  sira: number;
}

export function albumSec(analiz: HamAnaliz[], limit: number): AlbumSecim[] {
  // 1) Kalite filtresi (hepsi düşükse yine de aday bırak).
  let aday = analiz.filter((a) => !a.bulanik && !a.karanlik);
  if (aday.length === 0) aday = analiz.slice();

  // 2) Tekrar/benzer eleme — grup başına en iyi kalır.
  const grup = gruplaBenzer(aday);
  aday = aday.filter((a) => !grup.get(a.id)?.yinelenen);

  // 3) Kategori dengesi: kategori bazında kaliteye göre sırala, round-robin seç.
  const kategoriler = new Map<string, HamAnaliz[]>();
  for (const a of aday) {
    const k = a.kategori ?? "_";
    const arr = kategoriler.get(k);
    if (arr) arr.push(a);
    else kategoriler.set(k, [a]);
  }
  for (const arr of kategoriler.values()) {
    arr.sort((x, y) => (y.kalite_skor ?? 0) - (x.kalite_skor ?? 0));
  }

  const secilen: HamAnaliz[] = [];
  const anahtarlar = [...kategoriler.keys()];
  let bos = false;
  while (secilen.length < limit && !bos) {
    bos = true;
    for (const k of anahtarlar) {
      const arr = kategoriler.get(k)!;
      const item = arr.shift();
      if (item) {
        secilen.push(item);
        bos = false;
        if (secilen.length >= limit) break;
      }
    }
  }

  // 4) Hikâye akışına göre sırala (bölüm sırası, sonra kalite).
  secilen.sort((a, b) => {
    const ba = BOLUM_DUZEN.indexOf(bolumIcin(a.kategori));
    const bb = BOLUM_DUZEN.indexOf(bolumIcin(b.kategori));
    if (ba !== bb) return ba - bb;
    return (b.kalite_skor ?? 0) - (a.kalite_skor ?? 0);
  });

  return secilen.map((a, i) => ({
    media_id: a.id,
    bolum: bolumIcin(a.kategori),
    sira: i,
  }));
}
