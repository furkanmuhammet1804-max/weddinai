-- =============================================================
-- WEDDINAI — Migration 0012: Dijital Hatıra Defteri (Özellik 3)
--
-- Admin-only premium özellik. AI, etkinliğin misafir mesajlarından (guestbook)
-- bir hatıra defteri TASLAĞI üretir; admin düzenler ve YAYINLAR. Otomatik
-- yayın YOKTUR (durum 'taslak' → admin 'yayinda' yapar).
--
-- GÜVENLİK (Güvenlik Politikası §2): defter içeriği hassas kabul edilir ve
-- uygulama seviyesinde AES-256-GCM ile ŞİFRELİ saklanır (icerik_sifreli).
-- DB'de düz metin tutulmaz. Anahtar yalnız env (APP_ENCRYPTION_KEY).
--
-- Erişim: yazma/okuma yalnız service_role (admin sunucu rotaları). anon'a
-- tablo erişimi YOKTUR (RLS açık, public policy yok). Yayınlanan defter public
-- sayfada yine service_role ile, slug + durum='yayinda' kontrolüyle okunur.
--
-- NOT: IDEMPOTENT — Supabase SQL Editor'a güvenle (birden çok kez) yapıştırılır.
-- =============================================================

create extension if not exists pgcrypto;

create table if not exists public.hatira_defteri (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references public.events (id) on delete cascade,
  slug          text,                              -- yalnızca yayınlanınca atanır
  baslik        text not null default 'Hatıra Defteri',
  icerik_sifreli text,                             -- AES-256-GCM şifreli metin
  durum         text not null default 'taslak',    -- taslak | yayinda
  kaynak_ozet   jsonb not null default '{}'::jsonb, -- PII-siz: {mesaj_sayisi, ...}
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  published_at  timestamptz
);

create index if not exists idx_hatira_event on public.hatira_defteri (event_id);
create index if not exists idx_hatira_durum on public.hatira_defteri (durum);
create unique index if not exists idx_hatira_slug
  on public.hatira_defteri (slug) where slug is not null;

-- updated_at otomatik güncelleme (set_updated_at 0001'de tanımlı).
drop trigger if exists trg_hatira_updated on public.hatira_defteri;
create trigger trg_hatira_updated before update on public.hatira_defteri
  for each row execute function public.set_updated_at();

alter table public.hatira_defteri enable row level security;

grant all on public.hatira_defteri to service_role;
-- Giriş yapmış yönetici tutarlılık için okuyabilir (pratikte service_role okur).
grant select on public.hatira_defteri to authenticated;

drop policy if exists "Yetkili hatira defteri okur" on public.hatira_defteri;
create policy "Yetkili hatira defteri okur"
  on public.hatira_defteri for select to authenticated using (true);

-- =============================================================
-- 0012 sonu.
-- =============================================================
