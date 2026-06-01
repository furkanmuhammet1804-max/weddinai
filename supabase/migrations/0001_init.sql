-- =============================================================
-- WEDDINAI / PREMIUM ETKİNLİK MEDYA PLATFORMU
-- Migration 0001: Şema, İndeksler, RLS, Storage
-- =============================================================

-- ---------- EXTENSIONS ----------
create extension if not exists "pgcrypto";

-- ---------- ENUM TİPLERİ (Türkçe) ----------
create type plan_tipi       as enum ('ucretsiz', 'profesyonel', 'kurumsal');
create type etkinlik_turu   as enum ('dugun', 'nisan', 'kina', 'kurumsal_gala', 'dogum_gunu', 'parti', 'diger');
create type etkinlik_durum  as enum ('taslak', 'aktif', 'arsivlendi');
create type moderasyon_modu as enum ('direkt_yayinla', 'onay_gereksin');
create type medya_turu      as enum ('fotograf', 'video');
create type medya_durum     as enum ('beklemede', 'onaylandi', 'reddedildi');

-- =============================================================
-- TABLO: profiles  (auth.users'a bağlı)
-- =============================================================
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  email       text not null,
  plan_type   plan_tipi not null default 'ucretsiz',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- =============================================================
-- TABLO: events
-- =============================================================
create table public.events (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  title           text not null,
  event_type      etkinlik_turu not null default 'dugun',
  event_date      date,
  slug            text not null unique,
  status          etkinlik_durum not null default 'taslak',
  moderation_mode moderasyon_modu not null default 'direkt_yayinla',
  qr_settings     jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_events_user_id on public.events(user_id);
create unique index idx_events_slug on public.events(slug);
create index idx_events_status  on public.events(status);

-- =============================================================
-- TABLO: media
-- =============================================================
create table public.media (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references public.events(id) on delete cascade,
  storage_path  text not null,
  file_type     medya_turu not null,
  file_size     bigint not null default 0,
  status        medya_durum not null default 'beklemede',
  guest_name    text,
  likes_count   integer not null default 0,
  created_at    timestamptz not null default now()
);

create index idx_media_event_id     on public.media(event_id);
create index idx_media_event_status on public.media(event_id, status);
create index idx_media_created_at   on public.media(created_at desc);

-- =============================================================
-- TABLO: guestbook (anı defteri — yazılı & sesli)
-- =============================================================
create table public.guestbook (
  id                 uuid primary key default gen_random_uuid(),
  event_id           uuid not null references public.events(id) on delete cascade,
  guest_name         text,
  message_text       text,
  audio_storage_path text,
  created_at         timestamptz not null default now(),
  constraint chk_guestbook_icerik check (message_text is not null or audio_storage_path is not null)
);

create index idx_guestbook_event_id on public.guestbook(event_id);

-- =============================================================
-- updated_at OTOMATİK GÜNCELLEME TRIGGER'I
-- =============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger trg_events_updated before update on public.events
  for each row execute function public.set_updated_at();

-- =============================================================
-- YENİ KULLANICI -> profiles OTOMATİK OLUŞTURMA
-- =============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================
-- GÜVENLİ MİSAFİR YÜKLEME RPC'leri
-- (moderation_mode'a göre status'u sunucu tarafında belirler)
-- =============================================================
create or replace function public.misafir_medya_ekle(
  p_slug        text,
  p_storage_path text,
  p_file_type   medya_turu,
  p_file_size   bigint default 0,
  p_guest_name  text default null
)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_event public.events%rowtype;
  v_status medya_durum;
  v_id uuid;
begin
  select * into v_event from public.events where slug = p_slug and status = 'aktif';
  if not found then
    raise exception 'Etkinlik bulunamadı veya aktif değil';
  end if;

  v_status := case
    when v_event.moderation_mode = 'direkt_yayinla' then 'onaylandi'::medya_durum
    else 'beklemede'::medya_durum
  end;

  insert into public.media (event_id, storage_path, file_type, file_size, guest_name, status)
  values (v_event.id, p_storage_path, p_file_type, p_file_size, p_guest_name, v_status)
  returning id into v_id;

  return v_id;
end; $$;

create or replace function public.misafir_ani_ekle(
  p_slug         text,
  p_guest_name   text,
  p_message_text text default null,
  p_audio_path   text default null
)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_event_id uuid;
  v_id uuid;
begin
  select id into v_event_id from public.events where slug = p_slug and status = 'aktif';
  if v_event_id is null then
    raise exception 'Etkinlik bulunamadı veya aktif değil';
  end if;

  insert into public.guestbook (event_id, guest_name, message_text, audio_storage_path)
  values (v_event_id, p_guest_name, p_message_text, p_audio_path)
  returning id into v_id;

  return v_id;
end; $$;

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================
alter table public.profiles  enable row level security;
alter table public.events    enable row level security;
alter table public.media     enable row level security;
alter table public.guestbook enable row level security;

-- ---------- PROFILES ----------
create policy "Kullanıcı kendi profilini görür"
  on public.profiles for select using (auth.uid() = id);
create policy "Kullanıcı kendi profilini günceller"
  on public.profiles for update using (auth.uid() = id);

-- ---------- EVENTS ----------
create policy "Sahip kendi etkinliklerini yönetir"
  on public.events for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Aktif etkinlikler herkese açık okunur"
  on public.events for select
  using (status = 'aktif');

-- ---------- MEDIA ----------
create policy "Sahip kendi medyasını yönetir"
  on public.media for all
  using (exists (
    select 1 from public.events e
    where e.id = media.event_id and e.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.events e
    where e.id = media.event_id and e.user_id = auth.uid()
  ));

create policy "Onaylı medya herkese açık okunur"
  on public.media for select
  using (status = 'onaylandi' and exists (
    select 1 from public.events e
    where e.id = media.event_id and e.status = 'aktif'
  ));

-- ---------- GUESTBOOK ----------
create policy "Sahip kendi anı defterini yönetir"
  on public.guestbook for all
  using (exists (
    select 1 from public.events e
    where e.id = guestbook.event_id and e.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.events e
    where e.id = guestbook.event_id and e.user_id = auth.uid()
  ));

create policy "Anı defteri aktif etkinlikte herkese açık okunur"
  on public.guestbook for select
  using (exists (
    select 1 from public.events e
    where e.id = guestbook.event_id and e.status = 'aktif'
  ));

-- =============================================================
-- STORAGE BUCKET'LARI + politikalar
-- =============================================================
insert into storage.buckets (id, name, public)
values ('event-media', 'event-media', true), ('event-audio', 'event-audio', true)
on conflict (id) do nothing;

create policy "Medya herkese açık okunur"
  on storage.objects for select
  using (bucket_id in ('event-media', 'event-audio'));

create policy "Misafir medya yükleyebilir"
  on storage.objects for insert
  with check (bucket_id in ('event-media', 'event-audio'));
