// AI Medya Merkezi uçları — Zod giriş şemaları (Güvenlik Politikası §4).
import { z } from "zod";
import { KATEGORI_DEGERLER } from "@/lib/medya/sabit";

// Admin: bir etkinlik için KVKK AI onayını elle aç/kapat.
export const medyaOnaySema = z.object({
  eventId: z.string().uuid(),
  onay: z.boolean(),
});

// Admin: bekleyen fotoğrafları lokal yüz-kategorisine göre işle.
export const medyaAnalizSema = z.object({
  eventId: z.string().uuid(),
});

// Admin override: bir medyanın kategorisini elle değiştir (kaynak='admin').
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

// Public: misafir yüklemesi sonrası tek medyayı otomatik kategorile.
export const otoKategoriSema = z.object({
  slug: z.string().trim().min(1).max(120),
  mediaId: z.string().uuid(),
});
