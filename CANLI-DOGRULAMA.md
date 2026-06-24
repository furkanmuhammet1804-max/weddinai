# Canlı Doğrulama — Web BFF (2026-06-24)

`npm run dev` (localhost:3000) ayağa kaldırıldı; mobil/admin uçları gerçek
HTTP çağrılarıyla doğrulandı (Android emülatöründen ve curl ile).

## Build
- `next build` Turbopack, `Masaüstü` yolundaki **`ü`** yüzünden panic eder
  (turbopack ident bug — koddan bağımsız). **`npx next build --webpack`** ile
  derlenir: compiled + TypeScript geçti + tüm `/api/mobile/**` uçları kayıtlı.
- Statik prerender için env gerekir (`.env.local`); yoksa `/davetiye/talep`
  prerender'da Supabase hatası verir (kodla ilgisiz).

## Gerçek API sonuçları (çalışan dev server)
Admin (Bearer token):
- `POST /api/mobile/admin/giris` (admin/admin1234) → **200** (token)
- `POST /api/mobile/admin/giris` (yanlış) → **401** "Kullanıcı adı veya şifre hatalı."
- `GET /api/mobile/admin/dashboard` (token) → **200** · (token'sız) → **401** "Yetki yok."
- `GET /api/mobile/admin/oda` → **200** `{odalar:[]}`
- `GET /api/mobile/admin/medya` → **200** `{kuyruk:[]}`
- `GET /api/mobile/admin/davetiye` → **200** `{davetiyeler:[]}`
- `GET /api/mobile/admin/album` → **200** `{liste:[]}`
- `POST /api/mobile/admin/bildirim` → **200** `{ok:true,gonderilen:0}`

Müşteri (auth guard):
- `GET /api/mobile/medya` (token'sız) → **401** "Oturum geçersiz."
- `GET /api/mobile/showroom` (token'sız) → **401**
- `POST /api/mobile/favori` (token'sız) → **401**
- `POST /api/mobile/giris` (test creds) → **500** (gerçek `oda_dogrula` RPC'ye
  ulaşıyor; dummy Supabase olduğu için hata — gerçek DB ile 200/401 olur)

> Boş diziler/0 değerleri **dummy Supabase** kaynaklıdır (gerçek DB yok).
> Auth → token → veri → yanıt zinciri tam çalışıyor. Gerçek veri için
> `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
> `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_USERNAME/PASSWORD`, secret'lar.

## push_tokens migration
`supabase/migrations/0019_push_tokens.sql` Supabase'e uygulanmalı; aksi halde
bildirim uçları güvenle no-op (0 alıcı).
