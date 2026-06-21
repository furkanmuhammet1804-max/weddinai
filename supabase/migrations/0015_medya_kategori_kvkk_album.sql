-- =============================================================
-- WEDDINAI — Migration 0015: Medya Merkezi revizyonu + KVKK AI onay + Albüm aday
--
-- F4 REVİZYONU: Gemini Vision kategorileri KALDIRILDI. Artık misafir yüklediği
-- anda fotoğraf SUNUCUDA LOKAL yüz tespiti (pico.js, hiçbir yere gönderilmez)
-- ile kategorilenir:
--   medya_kategori: 'tekli' | 'toplu' | 'video'
--     tekli = 0–1 yüz, toplu = 2+ yüz, video = file_type video
--   medya_kategori_kaynak: 'oto' (otomatik) | 'admin' (override)
--   yuz_sayisi: tespit edilen yüz adedi (kanıt/izleme; PII değil)
--   oto_islendi: arka plan işleme tamamlandı mı (tekrar denememek için)
--
-- GÜVENLİK (Güvenlik Politikası §6): yüz tespiti biyometrik işleme sayıldığı
-- için YALNIZCA events.ai_medya_onay = true (KVKK onayı) ise foto için çalışır.
-- Onay yoksa videolar yine 'video' etiketlenir; fotoğraflar kategorisiz kalır
-- (oto_islendi=true) ve admin onay verince yeniden işlenebilir / elle override.
--
-- KVKK AKIŞI: her oda için imzalı bir onay token'ı. Müşteri /ai-onay/<token>
-- linkinden KVKK metnini okuyup onaylar; o etkinlikte ai_medya_onay=true olur,
-- onay tarihi (ai_medya_onay_at) + IP (ai_medya_onay_ip) kanıt olarak saklanır.
--
-- F5 REVİZYONU: albüm YALNIZCA admin tarafından kurulur (zaten öyleydi); AI
-- otomatik seçimi kaldırıldı. Müşteri fotoğrafı "albüme aday" işaretleyebilir
-- (media.album_aday); admin adaylar + favorilerden albümü elle kurar.
--
-- NOT: IDEMPOTENT. Rollback: supabase/rollback/0015_*_down.sql
-- =============================================================

-- ---- media: lokal yüz-kategori + albüm aday ----
alter table public.media
  add column if not exists medya_kategori text,            -- tekli|toplu|video
  add column if not exists medya_kategori_kaynak text,     -- 'oto' | 'admin'
  add column if not exists yuz_sayisi integer,             -- tespit edilen yüz adedi
  add column if not exists oto_islendi boolean not null default false,
  add column if not exists oto_islendi_at timestamptz,
  add column if not exists album_aday boolean not null default false;

create index if not exists idx_media_medya_kategori
  on public.media (event_id, medya_kategori);
create index if not exists idx_media_oto_islendi
  on public.media (event_id, oto_islendi);
create index if not exists idx_media_album_aday
  on public.media (event_id, album_aday);

-- ---- events: KVKK onay kanıtı + onay token'ı ----
-- (ai_medya_onay + ai_medya_onay_at 0013'te eklendi; burada IP + token ekleniyor)
alter table public.events
  add column if not exists ai_medya_onay_ip text,
  add column if not exists ai_onay_token text;

create unique index if not exists idx_events_ai_onay_token
  on public.events (ai_onay_token) where ai_onay_token is not null;

-- =============================================================
-- 0015 sonu. (Tüm yeni kolonlar service_role ile yazılır; mevcut GRANT yeterli.)
-- =============================================================
