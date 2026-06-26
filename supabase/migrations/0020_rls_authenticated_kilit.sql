-- =============================================================
-- WEDDINAI — Migration 0020: rol kilidi + RPC yetki sertleştirme (GÜVENLİK)
--
-- Canlı Supabase güvenlik denetçisi (get_advisors) + yapılan inceleme şunları
-- doğruladı; hepsi `authenticated`/`anon` rolünün ölü ama tehlikeli yetkileri:
--
-- A) PII TABLO POLİTİKALARI: 0006/0008/0011/0012/0014 tablolarında `authenticated`
--    rolüne GRANT + `using(true)` politikası vardı. Admin 0007 ile Supabase
--    Auth'tan çıktığından MEŞRU `authenticated` kullanıcı yok; signup açıkken
--    herkes public anon key ile authenticated JWT alıp talepler/davetiyeler/rsvp
--    PII'sini okuyup SİLEBİLİYORDU (talepler & davetiyeler `for all`).
--
-- B) ŞİFRE/DOĞRULAMA RPC'leri `anon`+`authenticated`a açıktı:
--    - oda_sifre_ayarla(uuid,text): SAHİPLİK KONTROLÜ YOK → anon herhangi bir
--      odanın şifresini değiştirip ele geçirebilirdi (KRİTİK, canlı sömürülebilir).
--    - oda_dogrula(text,text): anon doğrudan çağırıp BFF rate-limit'ini atlayarak
--      oda şifresi brute-force edebilirdi.
--    - oda_sifre_belirle(uuid,text): auth.uid kontrolü anon'u engelliyor ama yine
--      de ölü yetki.
--    Üçü de kodda yalnız service_role (admin.rpc / BFF) ile çağrılır → anon+
--    authenticated execute kaldırılır; service_role korunur.
--
-- C) handle_new_user() trigger fonksiyonu doğrudan çağrılabiliyordu → kaldırıldı.
-- D) set_updated_at() mutable search_path (linter) → sabitlendi.
--
-- DOKUNULMAYANLAR (bilerek): 0002 storage politikaları (auth.uid kapsamlı, güvenli);
-- misafir_*/etkinlik_genel_bilgi/aktif_etkinlik_mi (misafir akışı için anon gerekli);
-- service_role grant'leri (uygulamanın tek meşru yolu).
--
-- IDEMPOTENT. Uygulama: canlıya MCP/CLI ile push edildi. Ek savunma: Dashboard >
-- Authentication'da signup'ı kapat (config.toml false yapıldı) ve "Leaked password
-- protection"ı aç.
-- =============================================================

-- A) PII tablo politikaları + authenticated grant'leri --------------------------
drop policy if exists "Yetkili talepleri yonetir" on public.talepler;
revoke all on public.talepler from authenticated;

drop policy if exists "Yetkili davetiyeleri yonetir" on public.davetiyeler;
drop policy if exists "Yetkili rsvp yonetir" on public.davetiye_rsvp;
revoke all on public.davetiyeler from authenticated;
revoke all on public.davetiye_rsvp from authenticated;

drop policy if exists "Yetkili ai log okur" on public.ai_islem_log;
revoke all on public.ai_islem_log from authenticated;

drop policy if exists "Yetkili hatira defteri okur" on public.hatira_defteri;
revoke all on public.hatira_defteri from authenticated;

drop policy if exists "Yetkili album okur" on public.albumler;
drop policy if exists "Yetkili album foto okur" on public.album_fotograflar;
revoke all on public.albumler from authenticated;
revoke all on public.album_fotograflar from authenticated;

-- B) Şifre/doğrulama RPC'leri — yalnız service_role çağırmalı --------------------
revoke execute on function public.oda_sifre_ayarla(uuid, text) from anon, authenticated;
revoke execute on function public.oda_sifre_belirle(uuid, text) from anon, authenticated;
revoke execute on function public.oda_dogrula(text, text) from anon, authenticated;

-- C) Trigger fonksiyonu doğrudan çağrılamasın ----------------------------------
revoke execute on function public.handle_new_user() from anon, authenticated, public;

-- D) search_path sertleştirme (linter: function_search_path_mutable) ------------
alter function public.set_updated_at() set search_path = pg_catalog, public;

-- =============================================================
-- 0020 sonu.
-- =============================================================
