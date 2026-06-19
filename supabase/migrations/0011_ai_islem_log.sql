-- =============================================================
-- WEDDINAI — Migration 0011: AI İşlem Log (Faz 0 altyapısı)
--
-- Her AI çağrısı (örn. davetiye öneri asistanı) buraya kaydedilir:
--   - hangi işlem, hangi model, başarı/hata
--   - token kullanımı + tahmini USD maliyet
--   - süre, istemci IP'si (rate-limit için)
--   - girdi/çıktı özetleri (jsonb — PII'siz, teşhis için)
--
-- Kullanım amaçları:
--   1) Admin "AI İşlem Geçmişi" ekranı (maliyet + kullanım görünürlüğü)
--   2) IP başına hız limiti (rate-limit, son N saniyedeki satır sayısı)
--
-- Public AI rotaları service_role ile yazar; anon'a tablo erişimi YOKTUR
-- (RLS açık, public policy yok → service_role bypass eder).
-- =============================================================

create extension if not exists pgcrypto;

create table public.ai_islem_log (
  id            uuid primary key default gen_random_uuid(),
  islem_tip     text not null,                  -- 'davetiye-oneri' vb.
  model         text not null,
  basari        boolean not null default true,
  hata          text,
  girdi_ozet    jsonb,                          -- ör. {gelin, damat, tema}
  cikti_ozet    jsonb,                          -- ör. {adet: 3}
  input_token   integer not null default 0,
  output_token  integer not null default 0,
  maliyet_usd   numeric(12, 6) not null default 0,
  sure_ms       integer,
  ip            text,
  created_at    timestamptz not null default now()
);

-- Geçmiş ekranı: en yeni önce.
create index idx_ai_log_created on public.ai_islem_log (created_at desc);
-- Rate-limit: IP + işlem türü + zaman penceresi.
create index idx_ai_log_ip on public.ai_islem_log (ip, islem_tip, created_at desc);
create index idx_ai_log_tip on public.ai_islem_log (islem_tip);

alter table public.ai_islem_log enable row level security;

grant all on public.ai_islem_log to service_role;
-- Giriş yapmış yöneticinin (authenticated) okumasına izin (tutarlılık için;
-- admin paneli pratikte service_role ile okur).
grant select on public.ai_islem_log to authenticated;

create policy "Yetkili ai log okur"
  on public.ai_islem_log for select to authenticated using (true);
