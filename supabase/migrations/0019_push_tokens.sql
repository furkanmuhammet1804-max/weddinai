-- =============================================================
-- WEDDINAI — Migration 0019: Push bildirim token'ları (mobil)
--
-- Mobil uygulamalar (müşteri + admin) Expo push token'larını burada saklar.
-- Admin "Toplu/oda bazlı bildirim" gönderdiğinde bu tablodan alıcı token'ları
-- okunur ve Expo push servisine iletilir.
--
--   token      → ExponentPushToken[...] (benzersiz)
--   event_id   → token'ın bağlı olduğu oda (müşteri); admin için NULL olabilir
--   platform   → "ios" | "android"
--   rol        → "musteri" | "admin"
--
-- Yazma/okuma YALNIZCA service_role ile (BFF). Anon erişim yok (RLS kapalı,
-- grant verilmedi).
--
-- NOT: IDEMPOTENT.
-- =============================================================

create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  event_id uuid references public.events(id) on delete cascade,
  platform text not null default 'unknown',
  rol text not null default 'musteri',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_tokens_event_idx on public.push_tokens (event_id);
create index if not exists push_tokens_rol_idx on public.push_tokens (rol);

-- RLS açık ama policy yok → anon/auth erişemez; yalnız service_role (BFF) yazar/okur.
alter table public.push_tokens enable row level security;

-- =============================================================
-- 0019 sonu.
-- =============================================================
