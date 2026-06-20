-- =============================================================
-- WEDDINAI — Migration 0013: AI Medya Merkezi (Özellik 4)
--
-- media tablosuna AI/lokal analiz alanları + events'e KVKK onay bayrağı.
--
-- GÜVENLİK (Güvenlik Politikası §5/§6): fotoğraflar Gemini Vision'a YALNIZCA
-- events.ai_medya_onay = true ise gönderilir (KVKK onayı). Bulanık/karanlık/
-- yinelenen/benzer tespiti LOKAL (sharp) yapılır; AI'ya foto gönderilmez.
--
-- Kategoriler (ai_kategori): gelin_damat | aile | arkadas | grup | sahne |
--                            nikah | kina | dugun
-- ai_kategori_kaynak: 'ai' | 'admin' (admin override'ı ayırt etmek için)
--
-- NOT: IDEMPOTENT. Rollback: supabase/rollback/0013_medya_analiz_down.sql
-- =============================================================

-- ---- events: KVKK onayı ----
alter table public.events
  add column if not exists ai_medya_onay boolean not null default false,
  add column if not exists ai_medya_onay_at timestamptz;

-- ---- media: lokal + AI analiz alanları ----
alter table public.media
  add column if not exists ai_analiz_durum text not null default 'bekliyor', -- bekliyor|analiz_edildi
  add column if not exists ai_kategori text,
  add column if not exists ai_kategori_kaynak text,        -- 'ai' | 'admin'
  add column if not exists ai_bulanik boolean not null default false,
  add column if not exists ai_karanlik boolean not null default false,
  add column if not exists ai_kalite_skor numeric(5, 2),   -- 0..100 (F5 seçimi için)
  add column if not exists ai_phash text,                  -- algısal hash (aHash, hex)
  add column if not exists ai_grup_id text,                -- benzer/yinelenen grup kimliği
  add column if not exists ai_analiz_at timestamptz;

create index if not exists idx_media_ai_durum
  on public.media (event_id, ai_analiz_durum);
create index if not exists idx_media_ai_kategori
  on public.media (event_id, ai_kategori);

-- =============================================================
-- 0013 sonu. (Yeni kolonlar service_role ile yazılır; mevcut GRANT'lar yeterli.)
-- =============================================================
