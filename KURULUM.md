# WeddinAI — Milestone 1: Supabase Backend Kurulumu

Bu rehber, mock veriden gerçek veritabanına geçiş için izlenecek adımları içerir.

## 1. Docker Desktop kurulumu (gerekli)

Lokal Supabase, Docker üzerinde çalışır.

1. https://www.docker.com/products/docker-desktop/ adresinden **Docker Desktop for Windows**'u indirin.
2. Kurulumu tamamlayın, bilgisayarı yeniden başlatın.
3. Docker Desktop'ı açın ve **"Engine running"** (yeşil) yazana kadar bekleyin.
4. Doğrulama: terminalde `docker --version` çalışmalı.

> WSL2 gerekebilir — Docker Desktop kurulum sırasında otomatik kurar; istenirse Windows'u yeniden başlatın.

## 2. Supabase'i başlatın

Proje klasöründe (`ani-bulutu`):

```powershell
npx supabase start
```

İlk çalıştırma imajları indireceği için birkaç dakika sürer. Bittiğinde şuna benzer bir çıktı verir:

```
API URL: http://127.0.0.1:54321
anon key: eyJhbGciOi...
service_role key: eyJhbGciOi...
Studio URL: http://127.0.0.1:54323
```

## 3. Ortam değişkenlerini ayarlayın

`.env.local.example` dosyasını `.env.local` olarak kopyalayın ve yukarıdaki anahtarları yapıştırın:

```powershell
Copy-Item .env.local.example .env.local
```

### AI özellikleri için (Faz 0+)

AI Davetiye Asistanı ve AI işlem geçmişi için Google **Gemini** API anahtarı
gerekir. `.env.local` (ve Vercel ortam değişkenleri) içine ekleyin:

```
GEMINI_API_KEY=...
# Opsiyonel — sağlayıcı seçimi (varsayılan: gemini)
AI_PROVIDER=gemini
```

Anahtarı https://aistudio.google.com/apikey adresinden alabilirsiniz.
Varsayılan model `gemini-2.5-flash`'tır. Anahtar tanımlı değilse AI uçları
"servis yanıt veremedi" hatası döner; site geri kalanı normal çalışır.

> AI sağlayıcısı `lib/ai/provider.ts` üzerinden seçilir; yeni bir sağlayıcı
> eklemek için `lib/ai/providers/<ad>.ts` yazıp seçiciye ekleyin.

## 4. Migration'ı uygulayın

`supabase start` zaten `supabase/migrations/0001_init.sql` dosyasını otomatik uygular.
Sonradan değişiklik yaparsanız:

```powershell
npx supabase db reset
```

Tabloları **Supabase Studio**'dan görebilirsiniz: http://127.0.0.1:54323

## 5. Tip üretimi (opsiyonel ama önerilir)

```powershell
npx supabase gen types typescript --local > types/database.types.ts
```

## Hazır olan dosyalar

- `supabase/migrations/0001_init.sql` — tüm şema, RLS, RPC ve Storage bucket'ları
- `lib/supabase/client.ts` — tarayıcı istemcisi
- `lib/supabase/server.ts` — sunucu istemcisi
- `lib/supabase/middleware.ts` — oturum yenileme + `/panel` koruması

## Sonraki entegrasyon adımları (Docker hazır olunca yapılacak)

1. Kök `middleware.ts` dosyasını ekleyip `updateSession`'ı bağla
2. `/giris` ve `/kayit` formlarını gerçek Supabase Auth'a bağla
3. Panelde mock veriyi `events` / `media` sorgularıyla değiştir
4. Misafir yüklemesini `misafir_medya_ekle` RPC + Storage upload'a bağla
5. Canlı slaytı Supabase Realtime aboneliğine bağla
