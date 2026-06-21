-- Rollback 0016 — Albüm müşteri seçimi alanlarını geri al.
drop index if exists public.idx_albumler_secim_token;
alter table public.albumler
  drop column if exists secim_token,
  drop column if exists secim_tamamlandi,
  drop column if exists secim_tamamlandi_at;
