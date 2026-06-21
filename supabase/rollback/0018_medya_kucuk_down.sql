-- Rollback 0018 — thumbnail bayraklarını geri al.
drop index if exists public.idx_media_kucuk_hazir;
alter table public.media
  drop column if exists kucuk_hazir,
  drop column if exists kucuk_hazir_at;
