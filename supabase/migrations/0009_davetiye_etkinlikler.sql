-- =============================================================
-- WEDDINAI — Migration 0009: Davetiye dinamik etkinlikler + aile bilgileri
--
-- Sabit kına/düğün alanları yerine çift, istediği kadar etkinlik (Nişan, Kına,
-- Düğün, Nikah, …) ekleyebilsin → etkinlikler jsonb dizisi.
-- Her etkinlik: { tur, tarih, saat, mekan, adres, maps }.
-- Ayrıca opsiyonel aile bilgileri (gelin/damat tarafı).
-- (Eski kina_*/dugun_* kolonları geriye dönük uyum için bırakılır.)
-- =============================================================

alter table public.davetiyeler
  add column if not exists etkinlikler jsonb not null default '[]'::jsonb,
  add column if not exists gelin_aile text,
  add column if not exists damat_aile text;
