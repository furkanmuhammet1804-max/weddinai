-- =============================================================
-- WEDDINAI — Migration 0003: 3-panelli ODA yapısı
-- (Yönetici / Müşteri / Misafir) + etkinliğe özel showroom
--
-- Mantık:
--  * Her etkinlik = gizli bir "oda". Müşteri odasına ÖZEL LİNK + ODA
--    ŞİFRESİ ile girer (Supabase hesabı yok). Şifre bcrypt ile saklanır.
--  * Misafir QR ile odaya gelir; sadece YÜKLER (foto/video/ses/yazı),
--    galeri göremez, başka misafirin yüklediğini göremez.
--  * Müşteri kendi odasındaki tüm içeriği görür ve istediği fotoğrafı
--    "Showroom'da Yayınla" (showroom_approved) olarak işaretler.
--  * Showroom sayfası YALNIZCA showroom_approved fotoğrafları gösterir.
--
-- Müşteri ve misafir Supabase'de kimliklenmediği için onların okuma/
-- yazma işlemleri sunucu (service_role) üzerinden, oda kimliği
-- doğrulanarak yapılır. Bu migration tabloyu/■RLS'i buna göre sertleştirir.
--
-- pgcrypto (crypt/gen_salt) 0001'de kuruldu.
-- Uygulama sırası: 0001 -> 0002 -> 0003
-- =============================================================

-- -------------------------------------------------------------
-- 1) ODA ŞİFRESİ — events tablosuna bcrypt hash kolonu.
--    Müşteri girişini (link + şifre) doğrulamak için.
-- -------------------------------------------------------------
alter table public.events
  add column if not exists room_password_hash text;

-- -------------------------------------------------------------
-- 2) SHOWROOM ONAYI — media tablosuna müşteri onay bayrağı.
--    Varsayılan false: hiçbir şey otomatik olarak vitrine düşmez.
-- -------------------------------------------------------------
alter table public.media
  add column if not exists showroom_approved boolean not null default false;

create index if not exists idx_media_showroom
  on public.media (event_id, showroom_approved);

-- -------------------------------------------------------------
-- 3) GİZLİLİK SERTLEŞTİRME — geniş anon okuma politikalarını kaldır.
--
--  a) events: 0001'deki "Aktif etkinlikler herkese açık okunur" TÜM
--     kolonları anon'a açıyordu; artık room_password_hash içerdiği için
--     bu KRİTİK bir sızıntı. Misafir/genel erişim yalnızca güvenli
--     RPC (etkinlik_genel_bilgi — 0002) ile yapılır.
--  b) guestbook: "Anı defteri ... herkese açık okunur" anon'un BÜTÜN
--     yazılı/sesli anıları okumasına izin veriyordu → misafirler
--     birbirinin anısını görmemeli. Müşteri okuması service_role ile.
-- -------------------------------------------------------------
drop policy if exists "Aktif etkinlikler herkese açık okunur" on public.events;
drop policy if exists "Anı defteri aktif etkinlikte herkese açık okunur" on public.guestbook;

-- -------------------------------------------------------------
-- 4) SHOWROOM OKUMA — eski "status=onaylandi" public politikası yerine
--    yalnızca müşterinin onayladığı (showroom_approved) fotoğraflar
--    herkese açık okunur. (Aktif olmayan etkinliklerinki görünmez.)
-- -------------------------------------------------------------
drop policy if exists "Onaylı medya herkese açık okunur" on public.media;
create policy "Showroom onaylı medya herkese açık okunur"
  on public.media for select
  using (
    showroom_approved = true
    and exists (
      select 1 from public.events e
      where e.id = media.event_id and e.status = 'aktif'
    )
  );

-- -------------------------------------------------------------
-- 5) RPC: oda_sifre_belirle — yalnızca etkinlik SAHİBİ (yönetici)
--    kendi odasının şifresini belirler/günceller. Plaintext saklanmaz.
-- -------------------------------------------------------------
create or replace function public.oda_sifre_belirle(
  p_event_id uuid,
  p_password text
)
returns void
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_owner uuid;
begin
  if p_password is null or length(p_password) < 4 then
    raise exception 'Oda şifresi en az 4 karakter olmalı';
  end if;

  select user_id into v_owner from public.events where id = p_event_id;
  if v_owner is null then
    raise exception 'Etkinlik bulunamadı';
  end if;
  if v_owner is distinct from auth.uid() then
    raise exception 'Bu odayı düzenleme yetkiniz yok';
  end if;

  -- pgcrypto Supabase'de `extensions` şemasında; açıkça niteliyoruz.
  update public.events
     set room_password_hash = extensions.crypt(p_password, extensions.gen_salt('bf'))
   where id = p_event_id;
end;
$$;

revoke all on function public.oda_sifre_belirle(uuid, text) from public;
grant execute on function public.oda_sifre_belirle(uuid, text) to authenticated;

-- -------------------------------------------------------------
-- 6) RPC: oda_dogrula — müşteri girişi. slug + şifre doğruysa odanın
--    temel bilgisini döndürür; yanlışsa 0 satır. SADECE service_role
--    çağırabilir (sunucu rotası) — anon'a brute-force yüzeyi açmıyoruz.
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
    and e.room_password_hash is not null
    and e.room_password_hash = extensions.crypt(p_password, e.room_password_hash);
$$;

revoke all on function public.oda_dogrula(text, text) from public;
grant execute on function public.oda_dogrula(text, text) to service_role;

-- -------------------------------------------------------------
-- 7) misafir_medya_ekle güncelle: showroom_approved AÇIKÇA false
--    eklenir (varsayılan zaten false ama niyeti netleştiriyoruz) ve
--    moderasyon mantığı 0002 ile aynı kalır.
--    (İmza değişmediği için 0002'deki GRANT'lar geçerliliğini korur.)
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
  where lower(slug) = lower(p_slug) and status = 'aktif';
  if not found then
    raise exception 'Etkinlik bulunamadı veya aktif değil';
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

  -- showroom_approved DAİMA false ile başlar: vitrine çıkmak müşteri onayı ister.
  insert into public.media
    (event_id, storage_path, file_type, file_size, guest_name, status, showroom_approved)
  values
    (v_event.id, p_storage_path, p_file_type, p_file_size,
     nullif(trim(p_guest_name), ''), v_status, false)
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.misafir_medya_ekle(text, text, medya_turu, bigint, text) from public;
grant  execute on function public.misafir_medya_ekle(text, text, medya_turu, bigint, text) to anon, authenticated;

-- =============================================================
-- 0003 sonu.
-- =============================================================
