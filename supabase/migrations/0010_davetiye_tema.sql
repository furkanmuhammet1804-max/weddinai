-- =============================================================
-- WEDDINAI — Migration 0010: Davetiye teması
--
-- Müşteri sipariş sırasında davetiye görünümünü (tema) seçer.
-- Değerler: ivory (varsayılan) | gold | rose | midnight
-- Admin panelinde rozet olarak gösterilir.
-- =============================================================

alter table public.davetiyeler
  add column if not exists tema text not null default 'ivory';
