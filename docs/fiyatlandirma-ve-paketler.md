# WeddinAI — Fiyatlandırma & Paket Stratejisi

> Hedef: Hem çiftlere (B2C) hem profesyonellere (B2B) hitap eden, dönüşüm
> oranı yüksek, GPU/API maliyetlerini kredi mantığıyla koruyan bir model.

Temel kurgu:
- **Çiftler** için evlilik **tek seferlik** bir olay → *tek seferlik ödeme +
  süreli erişim* (abonelik baskısı yok, satın alma direnci düşük).
- **Profesyoneller** (fotoğrafçı/organizatör) sürekli üretim yapar → *aylık/
  yıllık abonelik* (öngörülebilir gelir, yüksek LTV).
- Tüm AI üretimi **kredi** ile ölçülür → maliyet kontrolü + net upsell yolu.

---

## 1) Kredi Modeli (maliyet koruması)

AI üretiminin GPU/API maliyeti işlem türüne göre değişir. Bunu kullanıcıya
**kredi** olarak yansıtırız (1 kredi ≈ 1 standart görsel üretimi):

| İşlem | Kredi | Neden |
|---|---|---|
| Standart AI fotoğraf üretimi (1024px) | 1 | Taban maliyet |
| Arka plan değiştirme | 1 | Tek geçiş |
| Face Swap (yüz değiştirme) | 2 | Ek model + yüz hizalama |
| HD / 2K upscale | 2 | Daha uzun GPU süresi |
| 4K ultra çözünürlük | 3 | En yüksek GPU yükü |
| AI davetiye metni / planlama önerisi (LLM) | 0.5 | Düşük maliyet |

> Kural: **Fiyatın tabanı = (paket kredisi × ortalama birim maliyet) × hedef
> brüt marj (≥ %70).** Kredi tükeniyorsa kullanıcı **kredi paketi** (top-up)
> satın alır — bu, doğal ve kârlı bir upsell kanalıdır.

**Ek kredi paketleri (her segmente):** 50 kredi $4.90 · 150 kredi $11.90 ·
500 kredi $34.90 (hacimde birim fiyat düşer, marj korunur).

---

## 2) Paket Yapısı

### 🤍 Başlangıç — "Çift Başlangıç"
**Kim için:** Bütçe dostu, temel ihtiyaçlı çiftler; "önce deneyeyim" diyenler.

- 100 AI kredisi
- 10 Face Swap hakkı
- 1 dijital davetiye (4 tema)
- HD (2K) çözünürlük
- 30 gün bulut depolama
- Filigransız 25 indirme
- E-posta destek

**Tek seferlik · 3 ay erişim**

---

### 💛 Premium Düğün — "Premium Düğün" ⭐ EN POPÜLER
**Kim için:** Düğününü baştan sona AI ile hazırlamak isteyen çiftlerin
çoğunluğu. Asıl yönlendirmek istediğimiz paket.

- **400 AI kredisi** (4×)
- **Sınırsız Face Swap**
- **3 dijital davetiye** (16 premium tema + müzikli açılış)
- **4K ultra çözünürlük**
- 6 ay bulut depolama
- **Filigransız sınırsız indirme**
- Albüm/slayt gösterisi üretimi
- Öncelikli işlem kuyruğu (daha hızlı render)
- Öncelikli WhatsApp destek

**Tek seferlik · 6 ay erişim**

---

### 💎 Profesyonel — "Fotoğrafçılar & Ajanslar"
**Kim için:** Düğün fotoğrafçıları, stüdyolar, organizatörler — sürekli ve
ticari kullanım.

- **2.000 AI kredisi / ay** (yenilenir)
- Sınırsız Face Swap + toplu (batch) işleme
- Sınırsız davetiye + müşteriye özel marka (white-label)
- 4K + ticari kullanım lisansı
- **Kalıcı bulut depolama** (abonelik boyunca)
- API erişimi + çoklu kullanıcı (3 koltuk)
- Müşteri paylaşım/onay paneli
- 7/24 öncelikli destek + hesap yöneticisi

**Aylık veya Yıllık abonelik (yıllıkta 2 ay bedava)**

---

## 3) Fiyatlandırma (USD birincil · EUR · TL)

> Psikolojik fiyatlandırma (.90/.99). TL değerleri kur'a göre güncellenmelidir;
> aşağıdaki TL'ler ~yuvarlanmış referanstır.

| Paket | USD | EUR | TL (yaklaşık) | Model |
|---|---|---|---|---|
| Çift Başlangıç | **$19.99** | €18.99 | ~₺899 | Tek seferlik / 3 ay |
| Premium Düğün ⭐ | **$49.99** | €47.99 | ~₺2.290 | Tek seferlik / 6 ay |
| Profesyonel (aylık) | **$39.99/ay** | €37.99 | ~₺1.790/ay | Abonelik |
| Profesyonel (yıllık) | **$399.90/yıl** | €379.90 | ~₺17.900/yıl | **2 ay bedava (~%17)** |

**Yıllık indirim kurgusu:** "Yıllık al, **2 ay bedava** (%17 tasarruf)" —
12 ay yerine 10 ay öde. Net ve güçlü bir mesaj; sayfada aylık fiyatın üstü
çizili gösterilir.

**Çiftlere özel upsell:** Premium satın alırken "+$9.99 ile erişimini
**12 aya** uzat" kutucuğu (sepet değerini artıran, marjsız-maliyetli ekleme).

---

## 4) "En Popüler" Paket İçin Kanca (Hook)

Premium Düğün'ü öne çıkarma taktikleri:

1. **Görsel vurgu:** Ortada, biraz büyük, marka şampanya rengiyle çerçeveli
   "EN POPÜLER" rozeti.
2. **Çapa (anchor) etkisi:** Başlangıç'ı bilinçli olarak "yetersiz" hissettir
   (10 face swap, 4 tema, 30 gün). Premium'un "sınırsız"ları parlasın.
3. **Birim değer mesajı:** "Başlangıç'ın **4 katı kredi**, sadece 2,5 katı
   fiyat" → kullanıcı kafasında en mantıklı seçim Premium olur.
4. **Kayıp korkusu (FOMO):** "Düğün bir kez olur — anılarını filigransız ve
   4K sakla." Tek seferlik olayın duygusal değeri fiyatı haklı çıkarır.
5. **Risksizlik:** "Beğenmezsen ilk 7 gün koşulsuz iade."
6. **Sosyal kanıt:** Rozetin altında "Çiftlerin %80'inin tercihi".

---

## 5) Özellik Karşılaştırma Tablosu (site taslağı)

| Özellik | Çift Başlangıç | Premium Düğün ⭐ | Profesyonel |
|---|---|---|---|
| AI kredisi | 100 | 400 | 2.000 / ay |
| Face Swap | 10 | Sınırsız | Sınırsız + batch |
| Dijital davetiye | 1 (4 tema) | 3 (16 tema + müzik) | Sınırsız + white-label |
| Çözünürlük | HD / 2K | 4K | 4K + ticari lisans |
| Arka plan değiştirme | ✓ | ✓ | ✓ |
| Albüm / slayt gösterisi | — | ✓ | ✓ |
| Filigransız indirme | 25 | Sınırsız | Sınırsız |
| Bulut depolama | 30 gün | 6 ay | Kalıcı |
| İşlem önceliği | Standart | Öncelikli | En yüksek |
| Çoklu kullanıcı / koltuk | — | — | 3 koltuk |
| API erişimi | — | — | ✓ |
| Müşteri onay paneli | — | — | ✓ |
| Destek | E-posta | Öncelikli WhatsApp | 7/24 + hesap yöneticisi |
| Ödeme | Tek seferlik | Tek seferlik | Aylık / Yıllık |
| Erişim | 3 ay | 6 ay | Abonelik boyunca |
| Fiyat | $19.99 | $49.99 | $39.99/ay |

---

## 6) Uygulama Notları

- **Freemium girişi:** 15 kredi ücretsiz deneme (kart istemeden) → ürünü
  yaşatır, dönüşümü artırır. Filigranlı çıktı.
- **Maliyet alarmı:** Kullanıcı bazında aylık GPU maliyeti izlenmeli; kötüye
  kullanım (paylaşılan profesyonel hesap) koltuk limitiyle sınırlanır.
- **Para birimi:** Konuma göre otomatik (geo-IP) USD/EUR/TL gösterimi; TL kur
  marjı (~%5) eklenerek dalgalanmaya karşı korunur.
- **Vergiler:** TL fiyatlarına KDV dahil gösterilmeli (yasal); USD/EUR'da
  checkout'ta eklenir.
