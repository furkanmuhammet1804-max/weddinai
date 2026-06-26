-- =============================================================
-- WEDDINAI — Migration 0020: `authenticated` rolü kilidi (GÜVENLİK)
--
-- SORUN (kritik, KVKK): 0006/0008/0011/0012/0014 tabloları `authenticated`
-- rolüne GRANT + `using (true)` politikası veriyordu. O migration'lar
-- "tek işletme: giriş yapmış yönetici = admin" varsayımıyla yazıldı; ama
-- 0007 ile admin Supabase Auth'tan ÇIKARILDI (env + HMAC çerez, service_role).
-- Sonuç: artık MEŞRU hiçbir `authenticated` Supabase kullanıcısı yok —
--   • Admin  → HMAC çerez + service_role (RLS'i bypass eder)
--   • Müşteri → site BFF'in ürettiği özel JWT (Supabase oturumu DEĞİL)
--   • Misafir → `anon` rolü, SECURITY DEFINER `misafir_*` RPC'leri
-- Buna karşın config'te signup AÇIK olduğundan, herkes public anon key ile
-- /auth/v1/signup çağırıp `authenticated` JWT alıp talepler/davetiyeler gibi
-- PII tablolarını OKUYABİLİR, hatta SİLEBİLİR (talepler & davetiyeler `for all`).
--
-- ÇÖZÜM: `authenticated` rolünden bu tablolardaki tüm yetkiyi ve `using(true)`
-- politikalarını geri al. Hiçbir meşru akış etkilenmez (hepsi service_role).
-- Ek olarak: oda şifresi belirleyen fonksiyonun `authenticated` execute yetkisi
-- (saldırgan herhangi bir odanın şifresini değiştirebilirdi) geri alınır.
--
-- DOKUNULMAYANLAR (bilerek):
--   • 0002 storage politikaları → `auth.uid()` ile sahip-kapsamlı, güvenli.
--   • `anon` GRANT'leri (misafir RPC'leri, storage INSERT) → misafir akışı için
--     gerekli, korunur.
--   • service_role GRANT'leri → uygulamanın tek meşru yazma/okuma yolu.
--
-- NOT: IDEMPOTENT — Supabase SQL Editor'a güvenle (birden çok kez) yapıştırılır.
-- UYGULAMA: Bu migration'ı kendi Supabase projenize uygulayın (CI/`db push`
-- veya SQL Editor). Ayrıca Dashboard > Authentication > Providers > Email'de
-- "Allow new users to sign up" seçeneğini KAPATIN (config.toml savunma amaçlı
-- güncellendi ama canlı ayar Dashboard'dadır).
-- =============================================================

-- talepler (lead/sipariş — müşteri PII): for all using(true) → kaldır
drop policy if exists "Yetkili talepleri yonetir" on public.talepler;
revoke all on public.talepler from authenticated;

-- davetiyeler + rsvp (çift PII + misafir RSVP): for all using(true) → kaldır
drop policy if exists "Yetkili davetiyeleri yonetir" on public.davetiyeler;
drop policy if exists "Yetkili rsvp yonetir" on public.davetiye_rsvp;
revoke all on public.davetiyeler from authenticated;
revoke all on public.davetiye_rsvp from authenticated;

-- ai_islem_log (IP + işlem kayıtları): select using(true) → kaldır
drop policy if exists "Yetkili ai log okur" on public.ai_islem_log;
revoke all on public.ai_islem_log from authenticated;

-- hatira_defteri (şifreli ama yine de korunur): select using(true) → kaldır
drop policy if exists "Yetkili hatira defteri okur" on public.hatira_defteri;
revoke all on public.hatira_defteri from authenticated;

-- albumler + album_fotograflar: select using(true) → kaldır
drop policy if exists "Yetkili album okur" on public.albumler;
drop policy if exists "Yetkili album foto okur" on public.album_fotograflar;
revoke all on public.albumler from authenticated;
revoke all on public.album_fotograflar from authenticated;

-- Oda şifresi belirleme: yalnız service_role (admin rotası) çağırmalı.
-- `authenticated`a execute, saldırganın herhangi bir odanın şifresini
-- değiştirmesine imkan veren ölü+tehlikeli bir yetkiydi → geri al.
revoke execute on function public.oda_sifre_belirle(uuid, text) from authenticated;

-- =============================================================
-- 0020 sonu.
-- =============================================================
