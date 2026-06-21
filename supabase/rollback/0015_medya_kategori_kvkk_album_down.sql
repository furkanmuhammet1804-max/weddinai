-- =============================================================
-- ROLLBACK — Migration 0015 (medya kategori + KVKK onay + albüm aday)
-- 0013 alanlarına (ai_medya_onay, ai_medya_onay_at) DOKUNMAZ.
-- =============================================================

drop index if exists public.idx_events_ai_onay_token;
drop index if exists public.idx_media_album_aday;
drop index if exists public.idx_media_oto_islendi;
drop index if exists public.idx_media_medya_kategori;

alter table public.events
  drop column if exists ai_onay_token,
  drop column if exists ai_medya_onay_ip;

alter table public.media
  drop column if exists album_aday,
  drop column if exists oto_islendi_at,
  drop column if exists oto_islendi,
  drop column if exists yuz_sayisi,
  drop column if exists medya_kategori_kaynak,
  drop column if exists medya_kategori;

-- =============================================================
-- 0015 rollback sonu.
-- =============================================================
