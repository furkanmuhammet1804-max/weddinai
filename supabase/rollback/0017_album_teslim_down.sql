-- Rollback 0017 — Albüm teslim alanlarını geri al.
alter table public.albumler
  drop column if exists teslim_edildi,
  drop column if exists teslim_edildi_at;
