// =============================================================
// AI uçları — Zod giriş şemaları (Güvenlik Politikası §4: input validation).
// Tüm public AI rotaları gövdeyi BURADAKİ şemalarla doğrular. Şemalar aynı
// zamanda girişi KIRPAR/SINIRLAR (uzunluk) → kötüye kullanım yüzeyini daraltır.
//
// Güvenlik notu: bu şemalar telefon/e-posta gibi alanları KASITLI olarak
// kabul ETMEZ; AI'ya yalnızca gerekli minimum veri (ton/kategori + ilk ad +
// kısa ipucu) geçer.
// =============================================================
import { z } from "zod";

// Boş string'i null'a indirger, baştaki/sondaki boşlukları temizler, sınırlar.
const opsMetin = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v.length ? v : null))
    .nullable()
    .optional()
    .transform((v) => v ?? null);

// ---- Özellik 1: Tebrik mesajı ----
export const tebrikOneriSema = z.object({
  ton: z.enum(["Kısa", "Samimi", "Duygusal", "Resmi", "Komik"]),
  cift_ad: opsMetin(120),
  iliski: opsMetin(60),
});
export type TebrikOneriGovde = z.infer<typeof tebrikOneriSema>;

// ---- Özellik 2: Davetiye not yardımcısı ----
export const davetiyeNotSema = z.object({
  kategori: z.enum(["hikaye", "aciklama", "tasarim"]),
  gelin_ad: opsMetin(80),
  damat_ad: opsMetin(80),
  ipucu: opsMetin(500),
});
export type DavetiyeNotGovde = z.infer<typeof davetiyeNotSema>;
