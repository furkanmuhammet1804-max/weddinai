-- =============================================================
-- WEDDINAI — Migration 0018: Thumbnail/Medium pipeline (sharp)
--
-- Galeri akıcılığı için her FOTOĞRAF yüklendiğinde sunucuda sharp ile küçük
-- türevler üretilir (Supabase transform KULLANILMAZ):
--   thumb  → 300px  WEBP q75  (grid)
--   medium → 1200px WEBP q85  (lightbox)
--   original korunur (indirme + PDF)
--
-- Türev yolları orijinal storage_path'ten TÜRETİLİR (yeni kolon gerekmez):
--   original: <eventId>/<uuid>.<ext>
--   thumb:    <eventId>/thumb/<uuid>.webp
--   medium:   <eventId>/medium/<uuid>.webp
--
-- Bu migration yalnız "türevler hazır mı" bayrağını ekler. Hazır değilse galeri
-- orijinale fallback eder → ESKİ FOTOĞRAFLAR BOZULMAZ. Admin "Thumbnail Yeniden
-- Oluştur" ile eski fotoğraflar için backfill yapar.
--
-- NOT: IDEMPOTENT. Rollback: supabase/rollback/0018_medya_kucuk_down.sql
-- =============================================================

alter table public.media
  add column if not exists kucuk_hazir boolean not null default false,
  add column if not exists kucuk_hazir_at timestamptz;

create index if not exists idx_media_kucuk_hazir
  on public.media (event_id, kucuk_hazir);

-- =============================================================
-- 0018 sonu. (service_role ile yazılır; mevcut GRANT yeterli.)
-- =============================================================
