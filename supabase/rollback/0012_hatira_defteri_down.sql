-- =============================================================
-- ROLLBACK — Migration 0012 (Dijital Hatıra Defteri)
-- hatira_defteri tablosunu ve tetikleyicisini kaldırır.
-- VERİ KAYBI uyarısı: tüm hatıra defterleri (şifreli içerik dahil) silinir.
-- =============================================================

drop trigger if exists trg_hatira_updated on public.hatira_defteri;
drop policy if exists "Yetkili hatira defteri okur" on public.hatira_defteri;
drop table if exists public.hatira_defteri;
