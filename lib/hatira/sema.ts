// =============================================================
// Hatıra Defteri admin uçları — Zod giriş şemaları (Güvenlik Politikası §4).
// =============================================================
import { z } from "zod";

export const hatiraUretSema = z.object({
  eventId: z.string().uuid(),
});

export const hatiraKaydetSema = z.object({
  id: z.string().uuid(),
  baslik: z.string().trim().min(1).max(120),
  icerik: z.string().max(20000),
});

export const hatiraYayinlaSema = z.object({
  id: z.string().uuid(),
  yayinla: z.boolean(),
});
