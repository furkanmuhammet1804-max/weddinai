// =============================================================
// Davetiye tema registry — tüm temalar tek yerde toplanır.
// Yeni tema eklemek: 1) ./yeni-tema.ts oluştur, 2) buraya import et,
// 3) DAVETIYE_TEMALAR dizisine ekle. if/else yok, switch yok.
// Yalnızca renk/atmosfer; client + server tarafından paylaşılır.
// =============================================================

import type { DavetiyeTema, DavetiyeTemaId } from "./tip";

// Mevcut temalar (korunur)
import { ivory } from "./ivory";
import { gold } from "./gold";
import { rose } from "./rose";
import { midnight } from "./midnight";
// Yeni premium temalar
import { champagneClassic } from "./champagne-classic";
import { luxuryGold } from "./luxury-gold";
import { royalIvory } from "./royal-ivory";
import { roseGarden } from "./rose-garden";
import { pearlWhite } from "./pearl-white";
import { emeraldElegance } from "./emerald-elegance";
import { midnightGold } from "./midnight-gold";
import { blackTie } from "./black-tie";
import { modernMinimal } from "./modern-minimal";
import { floralRomance } from "./floral-romance";
import { sunsetPeach } from "./sunset-peach";
import { lavenderDream } from "./lavender-dream";

export type { DavetiyeTema, DavetiyeTemaId };

// Görünüm sırası: önce klasikler, sonra yeni premium koleksiyon.
export const DAVETIYE_TEMALAR: DavetiyeTema[] = [
  ivory,
  champagneClassic,
  royalIvory,
  pearlWhite,
  modernMinimal,
  rose,
  roseGarden,
  floralRomance,
  sunsetPeach,
  lavenderDream,
  gold,
  luxuryGold,
  emeraldElegance,
  midnight,
  midnightGold,
  blackTie,
];

export const TEMA_IDLER: DavetiyeTemaId[] = DAVETIYE_TEMALAR.map((t) => t.id);

export function temaBul(id?: string | null): DavetiyeTema {
  return DAVETIYE_TEMALAR.find((t) => t.id === id) ?? DAVETIYE_TEMALAR[0];
}
