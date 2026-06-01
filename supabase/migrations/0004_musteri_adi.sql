-- =============================================================
-- WEDDINAI — Migration 0004: events.customer_name
-- Yönetici oda oluştururken müşteri adını ayrıca saklar.
-- (title = oda/etkinlik başlığı, örn. "Furkan & Bengisu";
--  customer_name = müşteri/iletişim adı.)
-- =============================================================
alter table public.events
  add column if not exists customer_name text;
