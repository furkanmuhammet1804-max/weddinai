-- =============================================================
-- WEDDINAI — Migration 0017: Albüm teslim işareti (F5 V3, satış anı modeli)
--
-- İŞ MODELİ (V3): Albüm hakkı SATIŞ ANINDA, oda oluşturulurken verilir
-- (admin "Dijital Albüm: 50/100/200" seçer). Talep/onay süreci YOKTUR. Müşteri
-- paneli, hak varsa "Dijital Albüm" sekmesini gösterir; müşteri seçer/sıralar/
-- kapak+bölüm belirler, tamamlar; admin PDF üretir ve TESLİM eder.
--
-- Bu migration albumler'e yalnız admin "teslim edildi" işaretini ekler:
--   teslim_edildi     → admin PDF'i müşteriye teslim etti mi
--   teslim_edildi_at  → teslim zamanı
--
-- ÇAKIŞMA: album hakkı = secim_token (0016); paket/limit = paket/limit_adet
-- (0014); seçim kilidi = secim_tamamlandi (0016). Tekrar alan açılmadı.
-- (Önceki taslak "talep" alanları bu modelde KULLANILMAZ; eklenmedi.)
--
-- NOT: IDEMPOTENT. Rollback: supabase/rollback/0017_album_teslim_down.sql
-- =============================================================

alter table public.albumler
  add column if not exists teslim_edildi boolean not null default false,
  add column if not exists teslim_edildi_at timestamptz;

-- =============================================================
-- 0017 sonu. (service_role ile yazılır; mevcut GRANT yeterli.)
-- =============================================================
