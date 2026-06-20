-- =============================================================
-- ROLLBACK — Migration 0013 (AI Medya Merkezi)
-- Eklenen kolonları/indeksleri geri alır. VERİ KAYBI uyarısı: bu kolonlardaki
-- analiz sonuçları silinir (medya/oda kayıtlarının kendisi KORUNUR).
-- Çalıştırma: Supabase SQL Editor'a yapıştır.
-- =============================================================

drop index if exists public.idx_media_ai_kategori;
drop index if exists public.idx_media_ai_durum;

alter table public.media
  drop column if exists ai_analiz_durum,
  drop column if exists ai_kategori,
  drop column if exists ai_kategori_kaynak,
  drop column if exists ai_bulanik,
  drop column if exists ai_karanlik,
  drop column if exists ai_kalite_skor,
  drop column if exists ai_phash,
  drop column if exists ai_grup_id,
  drop column if exists ai_analiz_at;

alter table public.events
  drop column if exists ai_medya_onay,
  drop column if exists ai_medya_onay_at;
