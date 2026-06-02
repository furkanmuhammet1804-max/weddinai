-- =============================================================
-- WEDDINAI — Migration 0006: talepler (sipariş/lead funnel)
--
-- Çift fiyat sayfasından paket seçip form doldurur → buraya düşer.
-- Yönetici panelde görür, iletişime geçer, ödemeyi alır, odayı açar.
-- (iyzico merchant hesabı hazır olunca online ödeme bunun üstüne eklenir.)
--
-- Public form INSERT'i service_role sunucu rotası ile yapılır (anon'a
-- doğrudan tablo erişimi YOK → kimse başkasının siparişini okuyamaz).
-- =============================================================

create table public.talepler (
  id            uuid primary key default gen_random_uuid(),
  paket         text not null,                 -- baslangic|standart|premium
  customer_name text not null,                 -- müşteri / çift adı
  event_type    text,                          -- dugun|nisan|...
  event_date    date,
  phone         text,
  email         text,
  note          text,
  durum         text not null default 'yeni',  -- yeni|iletisim|odendi|tamamlandi|iptal
  created_at    timestamptz not null default now()
);

create index idx_talepler_durum on public.talepler (durum);
create index idx_talepler_created on public.talepler (created_at desc);

alter table public.talepler enable row level security;

-- Yeni tablolar artık otomatik expose edilmiyor (cloud default) → açık GRANT.
grant select, insert, update, delete on public.talepler to authenticated;
grant all on public.talepler to service_role;

-- Giriş yapmış yöneticiler tüm talepleri yönetir (tek işletme).
create policy "Yetkili talepleri yonetir"
  on public.talepler for all
  to authenticated
  using (true)
  with check (true);
