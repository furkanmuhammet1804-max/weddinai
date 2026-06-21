-- =============================================================
-- WEDDINAI — Migration 0014: AI Dijital Düğün Albümü (Özellik 5)
--
-- Admin-only. Albüm YALNIZCA admin'in butona basmasıyla oluşturulur; otomatik
-- üretim YOKTUR. AI seçim mantığı (kalite + tekrar eleme + kategori dengesi)
-- F4 (medya analiz) verilerini kullanır. Admin sürükle-bırak/kapak/bölüm
-- düzenler ve yayınlar. Yayınlanınca public sayfa + paylaşım linki + PDF.
--
-- Paketler: baslangic(50) | premium(100) | vip(200) | ozel(limit_adet)
--
-- Erişim: yazma/okuma yalnız service_role (admin rotaları + public sayfa
-- service_role ile slug+durum kontrolüyle okur). anon'a tablo erişimi YOK.
--
-- NOT: IDEMPOTENT. Rollback: supabase/rollback/0014_album_down.sql
-- =============================================================

create extension if not exists pgcrypto;

create table if not exists public.albumler (
  id             uuid primary key default gen_random_uuid(),
  event_id       uuid not null references public.events (id) on delete cascade,
  slug           text,
  baslik         text not null default 'Düğün Albümü',
  paket          text not null default 'baslangic',  -- baslangic|premium|vip|ozel
  limit_adet     integer not null default 50,
  kapak_media_id uuid,                                -- media.id (FK YOK; esnek)
  durum          text not null default 'taslak',      -- taslak|yayinda
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  published_at   timestamptz
);

create index if not exists idx_albumler_event on public.albumler (event_id);
create unique index if not exists idx_albumler_slug
  on public.albumler (slug) where slug is not null;

create table if not exists public.album_fotograflar (
  id        uuid primary key default gen_random_uuid(),
  album_id  uuid not null references public.albumler (id) on delete cascade,
  media_id  uuid not null references public.media (id) on delete cascade,
  bolum     text,                                     -- ör. 'Nikah', 'Düğün'
  sira      integer not null default 0,
  created_at timestamptz not null default now(),
  unique (album_id, media_id)
);

create index if not exists idx_album_foto_album
  on public.album_fotograflar (album_id, sira);

-- updated_at otomatik (set_updated_at 0001'de tanımlı).
drop trigger if exists trg_albumler_updated on public.albumler;
create trigger trg_albumler_updated before update on public.albumler
  for each row execute function public.set_updated_at();

alter table public.albumler enable row level security;
alter table public.album_fotograflar enable row level security;

grant all on public.albumler to service_role;
grant all on public.album_fotograflar to service_role;
grant select on public.albumler to authenticated;
grant select on public.album_fotograflar to authenticated;

drop policy if exists "Yetkili album okur" on public.albumler;
create policy "Yetkili album okur"
  on public.albumler for select to authenticated using (true);
drop policy if exists "Yetkili album foto okur" on public.album_fotograflar;
create policy "Yetkili album foto okur"
  on public.album_fotograflar for select to authenticated using (true);

-- =============================================================
-- 0014 sonu.
-- =============================================================
