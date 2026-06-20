-- =============================================================
-- ROLLBACK — Migration 0014 (AI Dijital Albüm)
-- Albüm tablolarını ve tetikleyiciyi kaldırır.
-- VERİ KAYBI uyarısı: tüm albümler ve foto sıralamaları silinir
-- (medya/oda kayıtlarının kendisi KORUNUR).
-- =============================================================

drop trigger if exists trg_albumler_updated on public.albumler;
drop policy if exists "Yetkili album foto okur" on public.album_fotograflar;
drop policy if exists "Yetkili album okur" on public.albumler;
drop table if exists public.album_fotograflar;
drop table if exists public.albumler;
