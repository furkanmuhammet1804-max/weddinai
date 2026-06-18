-- =============================================================
-- WEDDINAI — Migration 0007: Tek-admin modeli + otomatik silme (7 gün)
--                            + showroom ADMIN ONAY akışı
--
-- DEĞİŞEN MİMARİ:
--  * Yönetici artık Supabase Auth kullanıcısı DEĞİL. Tek admin, env
--    (ADMIN_USERNAME/ADMIN_PASSWORD) ile giriş yapar ve TÜM yönetim
--    işlemlerini service_role (RLS bypass) ile yapar. Bu yüzden:
--      - events.user_id artık ZORUNLU değil (auth.uid yok).
--      - Oda şifresi belirleme için sahip kontrolü olmayan, yalnızca
--        service_role'a açık yeni bir RPC eklenir (oda_sifre_ayarla).
--
--  * GİZLİLİK / OTOMATİK SİLME: Her oda 7 gün sonra otomatik silinir.
--      - events.expires_at eklenir (varsayılan now()+7 gün).
--      - Süresi dolan / pasif odaya erişim her yerde kapatılır
--        (oda_dogrula, misafir_* , showroom okuma, storage upload).
--
--  * SHOWROOM ONAY AKIŞI:
--      Misafir yükler → Müşteri "showroom'a gönder" (showroom_requested)
--      → Admin onaylar (showroom_approved) → vitrinde görünür.
--      media.showroom_requested + media.is_favorite (müşteri favorisi).
--
-- Uygulama sırası: 0001 → … → 0006 → 0007
-- =============================================================

-- -------------------------------------------------------------
-- 1) events.user_id artık opsiyonel (admin auth kullanıcısı yok).
--    FK NULL'a izin verir; sadece NOT NULL kısıtını kaldırıyoruz.
-- -------------------------------------------------------------
alter table public.events alter column user_id drop not null;

-- -------------------------------------------------------------
-- 2) OTOMATİK SİLME — son kullanma tarihi.
-- -------------------------------------------------------------
alter table public.events
  add column if not exists expires_at timestamptz;

update public.events
   set expires_at = created_at + interval '7 days'
 where expires_at is null;

alter table public.events
  alter column expires_at set default (now() + interval '7 days');

create index if not exists idx_events_expires_at on public.events (expires_at);

-- -------------------------------------------------------------
-- 3) SHOWROOM ONAY akışı + müşteri favorisi.
--    showroom_requested: müşteri vitrine gönderdi (admin onayı bekliyor)
--    showroom_approved (0003): admin onayladı → vitrinde görünür
-- -------------------------------------------------------------
alter table public.media
  add column if not exists showroom_requested boolean not null default false;
alter table public.media
  add column if not exists is_favorite boolean not null default false;

create index if not exists idx_media_showroom_requested
  on public.media (event_id, showroom_requested);

-- -------------------------------------------------------------
-- 4) RPC: oda_sifre_ayarla — SADECE service_role (admin sunucu rotası).
--    Sahip kontrolü yok; çünkü yalnızca güvenli admin sunucusu çağırır.
-- -------------------------------------------------------------
create or replace function public.oda_sifre_ayarla(
  p_event_id uuid,
  p_password text
)
returns void
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
begin
  if p_password is null or length(p_password) < 4 then
    raise exception 'Oda şifresi en az 4 karakter olmalı';
  end if;
  update public.events
     set room_password_hash = extensions.crypt(p_password, extensions.gen_salt('bf'))
   where id = p_event_id;
  if not found then
    raise exception 'Etkinlik bulunamadı';
  end if;
end;
$$;

revoke all on function public.oda_sifre_ayarla(uuid, text) from public;
grant execute on function public.oda_sifre_ayarla(uuid, text) to service_role;

-- -------------------------------------------------------------
-- 5) aktif_etkinlik_mi (0005) — süre kontrolü ekle.
--    Aktif + süresi dolmamış. (storage upload + showroom okuma kullanır)
-- -------------------------------------------------------------
create or replace function public.aktif_etkinlik_mi(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.events
    where id = p_id
      and status = 'aktif'
      and (expires_at is null or expires_at > now())
  );
$$;

revoke all on function public.aktif_etkinlik_mi(uuid) from public;
grant execute on function public.aktif_etkinlik_mi(uuid)
  to anon, authenticated, service_role;

-- -------------------------------------------------------------
-- 6) oda_dogrula (0003) — müşteri girişi: aktif + süresi dolmamış zorunlu.
--    Pasif/süresi dolmuş odaya müşteri de giremez (erişim kapalı).
-- -------------------------------------------------------------
create or replace function public.oda_dogrula(
  p_slug text,
  p_password text
)
returns table (
  id         uuid,
  title      text,
  slug       text,
  event_type etkinlik_turu,
  event_date date,
  status     etkinlik_durum
)
language sql
stable
security definer
set search_path = public, extensions, pg_temp
as $$
  select e.id, e.title, e.slug, e.event_type, e.event_date, e.status
  from public.events e
  where lower(e.slug) = lower(p_slug)
    and e.status = 'aktif'
    and (e.expires_at is null or e.expires_at > now())
    and e.room_password_hash is not null
    and e.room_password_hash = extensions.crypt(p_password, e.room_password_hash);
$$;

revoke all on function public.oda_dogrula(text, text) from public;
grant execute on function public.oda_dogrula(text, text) to service_role;

-- -------------------------------------------------------------
-- 7) misafir_medya_ekle / misafir_ani_ekle / etkinlik_genel_bilgi —
--    hepsine "süresi dolmamış" koşulu ekle. (İmzalar değişmiyor →
--    önceki GRANT'lar geçerli kalır.)
-- -------------------------------------------------------------
create or replace function public.misafir_medya_ekle(
  p_slug         text,
  p_storage_path text,
  p_file_type    medya_turu,
  p_file_size    bigint default 0,
  p_guest_name   text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_event  public.events%rowtype;
  v_status medya_durum;
  v_id     uuid;
begin
  select * into v_event
  from public.events
  where lower(slug) = lower(p_slug)
    and status = 'aktif'
    and (expires_at is null or expires_at > now());
  if not found then
    raise exception 'Etkinlik bulunamadı, kapalı veya süresi dolmuş';
  end if;

  if p_storage_path is null or length(trim(p_storage_path)) = 0 then
    raise exception 'storage_path zorunlu';
  end if;
  if p_storage_path not like (v_event.id::text || '/%') then
    raise exception 'storage_path bu etkinliğe ait değil';
  end if;

  if p_file_size < 0 then
    p_file_size := 0;
  end if;
  if p_file_size > 209715200 then
    raise exception 'Dosya boyutu çok büyük';
  end if;

  v_status := case
    when v_event.moderation_mode = 'direkt_yayinla' then 'onaylandi'::medya_durum
    else 'beklemede'::medya_durum
  end;

  insert into public.media
    (event_id, storage_path, file_type, file_size, guest_name, status, showroom_approved, showroom_requested)
  values
    (v_event.id, p_storage_path, p_file_type, p_file_size,
     nullif(trim(p_guest_name), ''), v_status, false, false)
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.misafir_ani_ekle(
  p_slug         text,
  p_guest_name   text,
  p_message_text text default null,
  p_audio_path   text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_event public.events%rowtype;
  v_id    uuid;
begin
  select * into v_event
  from public.events
  where lower(slug) = lower(p_slug)
    and status = 'aktif'
    and (expires_at is null or expires_at > now());
  if not found then
    raise exception 'Etkinlik bulunamadı, kapalı veya süresi dolmuş';
  end if;

  if (p_message_text is null or length(trim(p_message_text)) = 0)
     and (p_audio_path is null or length(trim(p_audio_path)) = 0) then
    raise exception 'Mesaj veya ses kaydı gerekli';
  end if;

  if p_audio_path is not null and length(trim(p_audio_path)) > 0
     and p_audio_path not like (v_event.id::text || '/%') then
    raise exception 'audio_path bu etkinliğe ait değil';
  end if;

  insert into public.guestbook (event_id, guest_name, message_text, audio_storage_path)
  values (v_event.id,
          nullif(trim(p_guest_name), ''),
          nullif(trim(p_message_text), ''),
          nullif(trim(p_audio_path), ''))
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.etkinlik_genel_bilgi(p_slug text)
returns table (
  id          uuid,
  title       text,
  event_type  etkinlik_turu,
  event_date  date,
  slug        text,
  status      etkinlik_durum
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select e.id, e.title, e.event_type, e.event_date, e.slug, e.status
  from public.events e
  where lower(e.slug) = lower(p_slug)
    and e.status = 'aktif'
    and (e.expires_at is null or e.expires_at > now());
$$;

-- =============================================================
-- 0007 sonu.
-- =============================================================
