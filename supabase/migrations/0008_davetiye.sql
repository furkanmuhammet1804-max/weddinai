-- =============================================================
-- WEDDINAI — Migration 0008: Dijital Davetiye modülü
--
-- Akış: Çift /davetiye/talep formunu doldurur (materyaller + müzik) → kayıt
-- "talep_alindi" durumunda düşer. Yönetici panelden durumu ilerletir, ödemeyi
-- alır, tasarımı hazırlar ve yayına alır (slug atanır). Yayındaki davetiye
-- /davetiye/<slug> adresinde herkese açık gösterilir; misafirler RSVP bırakır.
--
-- Public form INSERT'i service_role sunucu rotası ile yapılır (talep + rsvp);
-- anon'a doğrudan tablo erişimi YOKTUR. Yalnızca davetiye MEDYA dosyaları,
-- public bucket'a anon ile yüklenir (4.5MB API limitini aşmamak için).
-- =============================================================

create table public.davetiyeler (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique,                       -- yalnızca yayınlanınca atanır
  -- Çift
  gelin_ad        text not null,
  damat_ad        text not null,
  phone           text,
  email           text,
  -- Kına
  kina_tarih      date,
  kina_saat       text,
  kina_mekan      text,
  kina_adres      text,
  kina_maps       text,
  -- Düğün
  dugun_tarih     date,
  dugun_saat      text,
  dugun_mekan     text,
  dugun_adres     text,
  dugun_maps      text,
  -- İçerik
  mesaj           text,
  notlar          text,
  -- Materyaller (storage path'leri, davetiye-media bucket)
  gelin_foto      text,
  damat_foto      text,
  foto_paths      text[] not null default '{}',
  -- Müzik
  muzik_youtube   text,
  muzik_path      text,
  -- Durum akışı
  durum           text not null default 'talep_alindi',
    -- talep_alindi|odeme_bekleniyor|odeme_onaylandi|tasarim_hazirlaniyor|
    -- musteri_onayi|yayinda|tamamlandi|iptal
  created_at      timestamptz not null default now(),
  published_at    timestamptz
);

create index idx_davetiyeler_durum on public.davetiyeler (durum);
create index idx_davetiyeler_created on public.davetiyeler (created_at desc);
create unique index idx_davetiyeler_slug on public.davetiyeler (slug) where slug is not null;

create table public.davetiye_rsvp (
  id            uuid primary key default gen_random_uuid(),
  davetiye_id   uuid not null references public.davetiyeler (id) on delete cascade,
  ad            text not null,
  katilim       text not null,            -- evet|hayir
  kisi_sayisi   int not null default 1,
  not_mesaj     text,
  created_at    timestamptz not null default now()
);

create index idx_rsvp_davetiye on public.davetiye_rsvp (davetiye_id);

alter table public.davetiyeler enable row level security;
alter table public.davetiye_rsvp enable row level security;

grant select, insert, update, delete on public.davetiyeler to authenticated;
grant select, insert, update, delete on public.davetiye_rsvp to authenticated;
grant all on public.davetiyeler to service_role;
grant all on public.davetiye_rsvp to service_role;

-- Tek işletme: giriş yapmış yönetici hepsini yönetir.
create policy "Yetkili davetiyeleri yonetir"
  on public.davetiyeler for all to authenticated using (true) with check (true);
create policy "Yetkili rsvp yonetir"
  on public.davetiye_rsvp for all to authenticated using (true) with check (true);

-- =============================================================
-- STORAGE: davetiye-media (public okunur, anon yükleyebilir)
-- =============================================================
insert into storage.buckets (id, name, public)
values ('davetiye-media', 'davetiye-media', true)
on conflict (id) do nothing;

create policy "Davetiye medya herkese acik okunur"
  on storage.objects for select
  using (bucket_id = 'davetiye-media');

create policy "Davetiye medya yuklenebilir"
  on storage.objects for insert
  with check (bucket_id = 'davetiye-media');
