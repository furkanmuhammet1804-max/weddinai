// AI Albüm admin uçları — Zod giriş şemaları (Güvenlik Politikası §4).
import { z } from "zod";
import { PAKET_DEGERLER } from "@/lib/album/sabit";

export const albumOlusturSema = z.object({
  eventId: z.string().uuid(),
  paket: z.string().refine((v) => PAKET_DEGERLER.includes(v), {
    message: "Geçersiz paket",
  }),
  ozelAdet: z.number().int().min(1).max(500).nullable().optional(),
});

export const albumKaydetSema = z.object({
  id: z.string().uuid(),
  baslik: z.string().trim().min(1).max(120),
  kapakMediaId: z.string().uuid().nullable(),
  fotograflar: z
    .array(
      z.object({
        media_id: z.string().uuid(),
        bolum: z.string().max(60).nullable(),
        sira: z.number().int().min(0),
      }),
    )
    .max(500),
});

export const albumYayinlaSema = z.object({
  id: z.string().uuid(),
  yayinla: z.boolean(),
});

// F5 V2 — müşteri seçim akışı (public, token ile).
export const albumSecimKaydetSema = z.object({
  token: z.string().trim().min(16).max(128),
  kapakMediaId: z.string().uuid().nullable(),
  fotograflar: z
    .array(
      z.object({
        media_id: z.string().uuid(),
        bolum: z.string().max(60).nullable(),
        sira: z.number().int().min(0),
      }),
    )
    .max(500),
});

export const albumSecimTamamlaSema = z.object({
  token: z.string().trim().min(16).max(128),
});

// F5 V3 — admin albümü teslim edildi olarak işaretler.
export const albumTeslimSema = z.object({
  albumId: z.string().uuid(),
  teslim: z.boolean(),
});
