-- =============================================================
-- WEDDINAI — Migration 0005: aktif etkinlik yardımcısı (RLS düzeltmesi)
--
-- SORUN: 0003 gizlilik için "Aktif etkinlikler herkese açık okunur"
-- (anon events SELECT) politikasını kaldırdı. Ancak hem storage upload
-- politikası hem de showroom media SELECT politikası, içlerinde
-- `exists (select 1 from public.events where ... status='aktif')`
-- alt sorgusu çalıştırıyor. Bu alt sorgu, çağıran rolün (anon) RLS'ine
-- TABİ olduğundan, anon artık events satırını GÖREMEDİĞİ için politika
-- FALSE dönüyor → misafir yüklemesi ve showroom okuması kırılıyor.
--
-- ÇÖZÜM: SECURITY DEFINER bir yardımcı fonksiyon (RLS'i bypass eder)
-- "bu etkinlik aktif mi?" sorusunu güvenle yanıtlar; iki politika da
-- bunu kullanır. Hassas alanlar (şifre hash'i vb.) hâlâ anon'a kapalı.
-- =============================================================

create or replace function public.aktif_etkinlik_mi(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.events
    where id = p_id and status = 'aktif'
  );
$$;

revoke all on function public.aktif_etkinlik_mi(uuid) from public;
grant execute on function public.aktif_etkinlik_mi(uuid)
  to anon, authenticated, service_role;

-- ---------- STORAGE: misafir yükleme politikası ----------
drop policy if exists "Aktif etkinlik klasörüne yükleme" on storage.objects;
create policy "Aktif etkinlik klasörüne yükleme"
  on storage.objects for insert
  to anon, authenticated
  with check (
    bucket_id in ('event-media', 'event-audio')
    and public.aktif_etkinlik_mi(public.storage_path_event(name))
  );

-- ---------- MEDIA: showroom okuma politikası ----------
drop policy if exists "Showroom onaylı medya herkese açık okunur" on public.media;
create policy "Showroom onaylı medya herkese açık okunur"
  on public.media for select
  using (
    showroom_approved = true
    and public.aktif_etkinlik_mi(media.event_id)
  );
