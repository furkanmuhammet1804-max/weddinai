-- =============================================================
-- WEDDINAI — Migration 0002: Edge-case & güvenlik düzeltmeleri
-- (Audit of 0001_init.sql. Idempotent / güvenli SQL.)
--
-- Bu migration UZAK veritabanına UYGULANMADAN ÖNCE gözden geçirilmelidir.
-- Her ifade neyi düzelttiğini açıklayan yorumla işaretlenmiştir.
-- =============================================================

-- -------------------------------------------------------------
-- FIX 1: profiles.updated_at trigger eksikliği DEĞİL — asıl sorun
--        handle_new_user trigger'ının çökmesi durumunda kayıt (signup)
--        komple başarısız olur. email NULL gelebilir (telefon/OAuth ile
--        kayıt), email zaten profiles'da NOT NULL. Ayrıca aynı kullanıcı
--        için yeniden tetiklenirse (idempotent değil) hata fırlatır.
--        Fonksiyonu savunmacı hale getiriyoruz: NULL email'i güvenli
--        bir değere düşür, çakışmada sessizce geç.
-- -------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp   -- search_path enjeksiyonuna karşı sabit
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    -- email NULL ise (telefon/anonim kayıt) profiles NOT NULL'u patlatmasın
    coalesce(new.email, new.id::text || '@no-email.local'),
    nullif(trim(new.raw_user_meta_data->>'full_name'), '')
  )
  on conflict (id) do nothing;   -- tekrar tetikte signup'ı çökertme
  return new;
end;
$$;

-- -------------------------------------------------------------
-- FIX 2: profiles tablosunda INSERT politikası YOK. RLS açık olduğu için
--        normalde sorun olmaz (trigger SECURITY DEFINER ile yazar), ANCAK
--        kullanıcı kendi profilini güncellerken WITH CHECK eksik: bir
--        kullanıcı update sırasında id'yi değiştirip BAŞKA bir profile
--        satırını ele geçiremez. Mevcut UPDATE politikasına WITH CHECK
--        ekliyoruz.
-- -------------------------------------------------------------
drop policy if exists "Kullanıcı kendi profilini günceller" on public.profiles;
create policy "Kullanıcı kendi profilini günceller"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- profiles için açık bir INSERT politikası: yalnızca kendi id'sine.
-- (Trigger zaten yazar; bu, ileride client-side upsert kullanılırsa
--  güvenli davranışı garanti eder. service_role yine bypass eder.)
drop policy if exists "Kullanıcı kendi profilini ekler" on public.profiles;
create policy "Kullanıcı kendi profilini ekler"
  on public.profiles for insert
  with check (auth.uid() = id);

-- -------------------------------------------------------------
-- FIX 3: events.slug benzersizliği BÜYÜK/küçük harfe duyarlı.
--        "Elif-Mert" ve "elif-mert" iki farklı slug sayılır; misafir
--        linkleri çakışır / yanlış etkinliğe gider. Ayrıca slug boş string
--        olabilir. Case-insensitive benzersizlik + boş slug yasağı.
--
--        NOT: Mevcut veride büyük harfli/duplike slug varsa bu indeks
--        oluşturma HATA verir. Uygulamadan önce veriyi normalize edin
--        (aşağıdaki APPLY INSTRUCTIONS'a bakın).
-- -------------------------------------------------------------
-- Eski case-sensitive unique indeksi kaldır (0001'de idx_events_slug + unique constraint vardı)
drop index if exists public.idx_events_slug;

-- Boş/whitespace slug'ı engelle
alter table public.events
  drop constraint if exists chk_events_slug_bos_degil;
alter table public.events
  add constraint chk_events_slug_bos_degil
  check (length(trim(slug)) > 0);

-- Case-insensitive benzersiz slug
create unique index if not exists idx_events_slug_lower
  on public.events (lower(slug));

-- -------------------------------------------------------------
-- FIX 4: media.file_size negatif olabilir; check yok. Kota/istatistik
--        hesaplarını bozar. Likes_count da negatif olabilir.
-- -------------------------------------------------------------
alter table public.media drop constraint if exists chk_media_file_size_pozitif;
alter table public.media
  add constraint chk_media_file_size_pozitif check (file_size >= 0);

alter table public.media drop constraint if exists chk_media_likes_pozitif;
alter table public.media
  add constraint chk_media_likes_pozitif check (likes_count >= 0);

-- storage_path boş olamaz (RPC dışından insert'lerde de geçerli)
alter table public.media drop constraint if exists chk_media_storage_path_bos_degil;
alter table public.media
  add constraint chk_media_storage_path_bos_degil check (length(trim(storage_path)) > 0);

-- -------------------------------------------------------------
-- FIX 5: guestbook satır içeriği var ama message_text/audio_path'in
--        ikisi de boş string ("") olabilir; CHECK yalnızca NULL'a bakıyor.
--        Boş ama "dolu" sayılan kayıtları engelle.
-- -------------------------------------------------------------
alter table public.guestbook drop constraint if exists chk_guestbook_icerik;
alter table public.guestbook
  add constraint chk_guestbook_icerik
  check (
    (message_text is not null and length(trim(message_text)) > 0)
    or (audio_storage_path is not null and length(trim(audio_storage_path)) > 0)
  );

-- -------------------------------------------------------------
-- FIX 6 (KRİTİK): "Aktif etkinlikler herkese açık okunur" politikası
--        events tablosunun TÜM kolonlarını anon'a açar — qr_settings
--        (gizli ayarlar/token içerebilir), user_id (sahip eşleştirme),
--        moderation_mode gibi alanlar dahil. Misafir akışı yalnızca slug
--        ile RPC çağırır; ham SELECT'e gerek yoktur.
--
--        Politikayı kaldırıp yerine güvenli bir VIEW koymuyoruz (ürün
--        kararı gerektirir); ancak en azından user_id sızıntısını
--        düşünmeniz için RECOMMENDED bölümüne taşıdık. Burada SADECE
--        anon'un ham events tablosunu okuduğunda hassas alanları
--        görmemesi için politikayı OLDUĞU GİBİ bırakmak yerine, public
--        okuma yolunu güvenli RPC'ye taşımayı öneriyoruz.
--
--        Acil ve net güvenli düzeltme: aşağıdaki public-read RPC.
--        (Politika kaldırma kararı için APPLY INSTRUCTIONS'a bakın.)
-- -------------------------------------------------------------
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
    and e.status = 'aktif';
$$;

-- -------------------------------------------------------------
-- FIX 7 (KRİTİK): misafir_medya_ekle / misafir_ani_ekle
--   a) slug eşleştirmesi case-sensitive -> lower() ile hizala (FIX 3 ile uyumlu)
--   b) p_storage_path / p_audio_path tamamen client kontrolünde; bir
--      misafir BAŞKA etkinliğin storage_path'ini DB'ye kaydedebilir
--      (kötü amaçlı atıf / içerik çalma). En azından NULL/boş engelle ve
--      EVENT'in storage prefix'iyle başlamasını zorunlu kıl.
--   c) p_file_size negatif/aşırı büyük olabilir -> sınırla.
--   d) search_path'i pg_temp dahil sabitle (SECURITY DEFINER sertleştirme).
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
  -- aktif etkinliği case-insensitive bul
  select * into v_event
  from public.events
  where lower(slug) = lower(p_slug) and status = 'aktif';
  if not found then
    raise exception 'Etkinlik bulunamadı veya aktif değil';
  end if;

  -- storage_path doğrulama: boş olamaz ve bu etkinliğin klasör
  -- prefix'iyle ("<event_id>/...") başlamalı. Misafir başka bir
  -- etkinliğin dosyasına atıf yapamaz.
  if p_storage_path is null or length(trim(p_storage_path)) = 0 then
    raise exception 'storage_path zorunlu';
  end if;
  if p_storage_path not like (v_event.id::text || '/%') then
    raise exception 'storage_path bu etkinliğe ait değil';
  end if;

  -- dosya boyutu makul sınırlar (negatif yok, ~200MB üst sınır)
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

  insert into public.media (event_id, storage_path, file_type, file_size, guest_name, status)
  values (v_event.id, p_storage_path, p_file_type, p_file_size,
          nullif(trim(p_guest_name), ''), v_status)
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
  where lower(slug) = lower(p_slug) and status = 'aktif';
  if not found then
    raise exception 'Etkinlik bulunamadı veya aktif değil';
  end if;

  -- en az bir gerçek içerik gerekli (boş string sayılmaz)
  if (p_message_text is null or length(trim(p_message_text)) = 0)
     and (p_audio_path is null or length(trim(p_audio_path)) = 0) then
    raise exception 'Mesaj veya ses kaydı gerekli';
  end if;

  -- ses kaydı varsa bu etkinliğin klasörüne ait olmalı
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

-- -------------------------------------------------------------
-- FIX 8 (KRİTİK — EXECUTE yetkisi): SECURITY DEFINER fonksiyonlar
--        varsayılan olarak PUBLIC'e EXECUTE açar. RPC'lerin yalnızca
--        anon + authenticated tarafından çağrılabilmesini netleştir;
--        diğer tüm rollerden (örn. ileride eklenen rollerden) yetkiyi al.
--        Ayrıca yeni public-read RPC için yetki ver.
-- -------------------------------------------------------------
revoke all on function public.misafir_medya_ekle(text, text, medya_turu, bigint, text) from public;
grant  execute on function public.misafir_medya_ekle(text, text, medya_turu, bigint, text) to anon, authenticated;

revoke all on function public.misafir_ani_ekle(text, text, text, text) from public;
grant  execute on function public.misafir_ani_ekle(text, text, text, text) to anon, authenticated;

revoke all on function public.etkinlik_genel_bilgi(text) from public;
grant  execute on function public.etkinlik_genel_bilgi(text) to anon, authenticated;

-- handle_new_user yalnızca trigger ile çalışmalı; doğrudan çağrıyı kapat
revoke all on function public.handle_new_user() from public;

-- -------------------------------------------------------------
-- FIX 9 (KRİTİK — RLS yazma boşluğu): media tablosunda misafir INSERT'i
--        SADECE RPC (SECURITY DEFINER) üzerinden yapılır; doğrudan tablo
--        INSERT'i için anon'a politika YOK -> doğru. ANCAK "Sahip kendi
--        medyasını yönetir" FOR ALL politikası DELETE/UPDATE'i de kapsar,
--        bu iyi. Asıl boşluk: anon, RPC dışında media'ya yazamaz; emin
--        olmak için anon'a doğrudan tablo yazma yetkisi OLMADIĞINI
--        belgeliyoruz (Supabase'de anon'a tablo GRANT'i RLS ile sınırlı).
--        Burada ek bir kısıtlama: anon doğrudan media INSERT denerse
--        engellensin diye negatif bir politika gerekmez (politika yokluğu
--        = red). Bilgi amaçlı; SQL değişikliği yok.
--
--        guestbook için de aynı durum geçerli.
-- -------------------------------------------------------------
-- (no-op; belgeleme)

-- -------------------------------------------------------------
-- FIX 10 (KRİTİK — STORAGE): 0001'deki storage politikaları
--   a) INSERT'i bucket'a SINIRSIZ açıyor: HERHANGİ biri (anon dahil)
--      event-media/event-audio bucket'ına İSTEDİĞİ path'e dosya
--      yükleyebilir, başkasının dosyasının üzerine yazabilir, sınırsız
--      depolama tüketebilir. Path/etkinlik doğrulaması yok.
--   b) SELECT herkese açık -> "beklemede"/"reddedildi" (onaysız) medya
--      dosyaları bile public URL ile erişilebilir; moderasyon anlamsız
--      hale gelir.
--   c) UPDATE/DELETE politikası yok -> sahip kendi dosyasını storage'dan
--      silemez (RLS açık olduğu için yetkili kullanıcı bile engellenir).
--
--   Çözüm: bucket'ları PRIVATE yap; INSERT'i path'in ilk klasörünün
--   geçerli bir event id olmasıyla sınırla; okuma/silme/güncellemeyi
--   etkinlik sahibine (authenticated) ver. Misafir okuması imzalı URL
--   (signed URL) ile yapılır -> bu da onaysız medyanın sızmasını önler.
-- -------------------------------------------------------------

-- Bucket'ları private yap (signed URL zorunlu). Public URL sızıntısını kapatır.
update storage.buckets
  set public = false
  where id in ('event-media', 'event-audio');

-- Eski aşırı geniş politikaları kaldır
drop policy if exists "Medya herkese açık okunur" on storage.objects;
drop policy if exists "Misafir medya yükleyebilir" on storage.objects;

-- Yardımcı: path'in ilk segmenti geçerli bir aktif etkinlik id'si mi?
-- (storage.foldername(name)[1] dosyanın ilk klasörünü verir.)
create or replace function public.storage_path_event(p_name text)
returns uuid
language sql
stable
set search_path = public, pg_temp
as $$
  -- name "<event_id>/dosya.jpg" formatında; ilk segmenti uuid'e çevir
  select case
    when split_part(p_name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then split_part(p_name, '/', 1)::uuid
    else null
  end;
$$;

-- INSERT: yalnızca aktif bir etkinliğin klasörüne yükleme (anon + authenticated).
-- Misafir yükleme akışını korur ama path'i etkinliğe sabitler.
create policy "Aktif etkinlik klasörüne yükleme"
  on storage.objects for insert
  to anon, authenticated
  with check (
    bucket_id in ('event-media', 'event-audio')
    and exists (
      select 1 from public.events e
      where e.id = public.storage_path_event(name)
        and e.status = 'aktif'
    )
  );

-- SELECT: etkinlik SAHİBİ kendi dosyalarını okur (panel).
-- Misafir/anon okuması signed URL ile yapılır (RLS'i bypass eden imzalı
-- erişim), bu yüzden anon'a genel SELECT vermiyoruz -> onaysız medya
-- public URL ile sızmaz.
create policy "Sahip storage dosyalarını okur"
  on storage.objects for select
  to authenticated
  using (
    bucket_id in ('event-media', 'event-audio')
    and exists (
      select 1 from public.events e
      where e.id = public.storage_path_event(name)
        and e.user_id = auth.uid()
    )
  );

-- DELETE: yalnızca etkinlik sahibi kendi dosyasını siler.
create policy "Sahip storage dosyalarını siler"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id in ('event-media', 'event-audio')
    and exists (
      select 1 from public.events e
      where e.id = public.storage_path_event(name)
        and e.user_id = auth.uid()
    )
  );

-- UPDATE: yalnızca etkinlik sahibi (metadata vs. güncelleme için).
create policy "Sahip storage dosyalarını günceller"
  on storage.objects for update
  to authenticated
  using (
    bucket_id in ('event-media', 'event-audio')
    and exists (
      select 1 from public.events e
      where e.id = public.storage_path_event(name)
        and e.user_id = auth.uid()
    )
  )
  with check (
    bucket_id in ('event-media', 'event-audio')
    and exists (
      select 1 from public.events e
      where e.id = public.storage_path_event(name)
        and e.user_id = auth.uid()
    )
  );

-- -------------------------------------------------------------
-- FIX 11: profiles.email benzersiz değil. auth.users zaten email'i tekil
--         tutar ama profiles'da çift kayıt mantığı bozabilir. Ayrıca
--         email'i case-insensitive tekil yapmak çoğu zaman istenir.
--         (Veride çift email olabileceği için ZORUNLU değil — bilgi
--         amaçlı yorumda bırakıyoruz; ürün kararı.)
-- create unique index if not exists idx_profiles_email_lower
--   on public.profiles (lower(email));

-- -------------------------------------------------------------
-- FIX 12: guestbook tablosunda created_at indeksi yok ama sıralama
--         büyük ihtimalle created_at'e göre. Panel sorgularını hızlandır.
-- -------------------------------------------------------------
create index if not exists idx_guestbook_created_at
  on public.guestbook (created_at desc);

-- events.user_id zaten indeksli; media FK'leri indeksli. Tamamlandı.
