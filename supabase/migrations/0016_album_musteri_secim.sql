-- =============================================================
-- WEDDINAI — Migration 0016: Albüm müşteri seçimi (F5 V2)
--
-- YENİ AKIŞ: Albüm hizmeti alan müşteriye özel, tahmin edilemez bir token ile
-- "albüm hazırlama" linki (/album-sec/<token>) verilir. Müşteri KENDİ odasının
-- fotoğraflarından seçer, sıralar, kapak ve bölüm belirler. Albümü üretme yetkisi
-- yine YALNIZCA admindedir (admin PDF üretir).
--
-- Mevcut yapı (0014) korunur: albumler + album_fotograflar tabloları ve premium
-- PDF aynen kullanılır. Müşteri seçimi doğrudan bu tablolara yazılır:
--   album_fotograflar.media_id / bolum / sira  → müşteri seçimi + sırası + bölümü
--   albumler.kapak_media_id                    → müşteri kapağı
--   albumler.paket / limit_adet                → admin verdiği paket + foto limiti
--
-- Bu migration albumler'e müşteri-seçim akışı alanlarını ekler:
--   secim_token         → /album-sec/<token> (tahmin edilemez, 32+ kar)
--   secim_tamamlandi    → müşteri "Seçimimi Tamamla" dedi mi (readonly kilidi)
--   secim_tamamlandi_at → tamamlanma zamanı (admin listesinde gösterilir)
--   durum               → yeni değer 'secim' (müşteri seçim yapıyor) eklenir;
--                         lifecycle: secim → taslak (tamamlandı) → yayinda
--
-- ÇAKIŞMA KONTROLÜ: events tarafında albüm alanı yoktu; albumler'de paket +
-- limit_adet zaten vardı (album_foto_limit ile çakışırdı), tekrar EKLENMEDİ.
-- "album_hakki" = albumler satırının (secim_token ile) var olması.
--
-- GÜVENLİK: secim_token tahmin edilemez; tablolar yalnız service_role ile
-- yazılır (mevcut GRANT/RLS korunur). anon erişimi YOK.
--
-- NOT: IDEMPOTENT. Rollback: supabase/rollback/0016_album_musteri_secim_down.sql
-- =============================================================

alter table public.albumler
  add column if not exists secim_token text,
  add column if not exists secim_tamamlandi boolean not null default false,
  add column if not exists secim_tamamlandi_at timestamptz;

create unique index if not exists idx_albumler_secim_token
  on public.albumler (secim_token) where secim_token is not null;

-- =============================================================
-- 0016 sonu. (Tüm yeni alanlar service_role ile yazılır; mevcut GRANT yeterli.)
-- =============================================================
