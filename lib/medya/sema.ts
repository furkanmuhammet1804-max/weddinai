// AI Medya Merkezi admin uçları — Zod giriş şemaları (Güvenlik Politikası §4).
import { z } from "zod";
import { KATEGORI_DEGERLER } from "@/lib/medya/sabit";

export const medyaOnaySema = z.object({
  eventId: z.string().uuid(),
  onay: z.boolean(),
});

export const medyaAnalizSema = z.object({
  eventId: z.string().uuid(),
});

export const medyaSinifSema = z.object({
  mediaId: z.string().uuid(),
  // null = kategoriyi temizle; aksi halde geçerli kategori değeri.
  kategori: z
    .string()
    .nullable()
    .refine((v) => v === null || KATEGORI_DEGERLER.includes(v), {
      message: "Geçersiz kategori",
    }),
});
