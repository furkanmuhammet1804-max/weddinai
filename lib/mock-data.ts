// =============================================================
// Mock veri — Supabase bağlanana kadar arayüzü beslemek için.
// Tüm metinler Türkçe.
// =============================================================

export type EtkinlikTuru =
  | "dugun"
  | "nisan"
  | "kina"
  | "kurumsal_gala"
  | "dogum_gunu"
  | "parti";

export const ETKINLIK_TURU_ETIKET: Record<EtkinlikTuru, string> = {
  dugun: "Düğün",
  nisan: "Nişan",
  kina: "Kına Gecesi",
  kurumsal_gala: "Kurumsal Gala",
  dogum_gunu: "Doğum Günü",
  parti: "Parti",
};

export type MedyaTuru = "fotograf" | "video";
export type MedyaDurum = "beklemede" | "onaylandi" | "reddedildi";

export interface Etkinlik {
  id: string;
  title: string;
  event_type: EtkinlikTuru;
  event_date: string;
  slug: string;
  status: "taslak" | "aktif" | "arsivlendi";
  cover: string; // degrade arka plan sınıfı
  moderation: "direkt_yayinla" | "onay_gereksin";
}

export interface Medya {
  id: string;
  guest_name: string;
  file_type: MedyaTuru;
  status: MedyaDurum;
  likes: number;
  // görsel yerine zarif degrade + en-boy oranı (mock)
  tone: string;
  ratio: "kare" | "dikey" | "yatay";
  created_at: string;
}

export interface AniDefteriKayit {
  id: string;
  guest_name: string;
  message: string;
  has_audio: boolean;
  created_at: string;
}

export const ornekEtkinlik: Etkinlik = {
  id: "evt_001",
  title: "Elif & Mert Düğünü",
  event_type: "dugun",
  event_date: "2026-08-15",
  slug: "elif-mert",
  status: "aktif",
  cover: "from-rose-soft via-primary-soft to-background",
  moderation: "direkt_yayinla",
};

export const etkinlikler: Etkinlik[] = [
  ornekEtkinlik,
  {
    id: "evt_002",
    title: "Zeynep'in Kına Gecesi",
    event_type: "kina",
    event_date: "2026-07-02",
    slug: "zeynep-kina",
    status: "aktif",
    cover: "from-rose-soft to-primary-soft",
    moderation: "onay_gereksin",
  },
  {
    id: "evt_003",
    title: "Atlas Holding Yıl Sonu Galası",
    event_type: "kurumsal_gala",
    event_date: "2026-12-20",
    slug: "atlas-gala-2026",
    status: "taslak",
    cover: "from-primary-soft to-muted",
    moderation: "onay_gereksin",
  },
];

const tonlar = [
  "from-rose to-primary-soft",
  "from-primary-soft to-accent",
  "from-muted to-rose-soft",
  "from-accent to-primary",
  "from-rose-soft to-primary-soft",
  "from-primary to-rose",
];

const isimler = [
  "Ayşe Kaya",
  "Mehmet Demir",
  "Selin Yıldız",
  "Burak Aydın",
  "Deniz Şahin",
  "Ece Arslan",
  "Kerem Öztürk",
  "Naz Çelik",
  "Emre Koç",
  "İrem Doğan",
  "Can Yılmaz",
  "Melis Aksoy",
];

const oranlar: Medya["ratio"][] = ["dikey", "kare", "yatay", "dikey", "kare"];

export const medyaListesi: Medya[] = Array.from({ length: 18 }, (_, i) => ({
  id: `med_${i + 1}`,
  guest_name: isimler[i % isimler.length],
  file_type: i % 5 === 0 ? "video" : "fotograf",
  status: i % 7 === 0 ? "beklemede" : "onaylandi",
  // Deterministik (sunucu/istemci aynı sonucu üretsin — hydration uyumsuzluğu olmasın)
  likes: ((i * 13) % 48) + 2,
  tone: tonlar[i % tonlar.length],
  ratio: oranlar[i % oranlar.length],
  created_at: `2026-08-15T${String(18 + (i % 6)).padStart(2, "0")}:${String(
    (i * 7) % 60,
  ).padStart(2, "0")}:00`,
}));

export const aniDefteri: AniDefteriKayit[] = [
  {
    id: "gb_1",
    guest_name: "Ayşe Kaya",
    message:
      "Bir ömür boyu sürecek mutluluklar dileriz! Bu güzel günde yanınızda olmak büyük bir onurdu. 💍",
    has_audio: true,
    created_at: "2026-08-15T19:24:00",
  },
  {
    id: "gb_2",
    guest_name: "Mehmet Demir",
    message:
      "Sevginiz hep bugünkü gibi taze kalsın. Nice mutlu yıllara, başınız hiç dara düşmesin.",
    has_audio: false,
    created_at: "2026-08-15T20:02:00",
  },
  {
    id: "gb_3",
    guest_name: "Selin Yıldız",
    message:
      "İki güzel insanın bir araya gelişine şahit olmak çok değerliydi. Sonsuza dek mutlu olun!",
    has_audio: true,
    created_at: "2026-08-15T21:15:00",
  },
];

// Panel genel bakış istatistikleri (mock)
export const panelIstatistik = {
  toplamYukleme: 482,
  fotograf: 391,
  video: 91,
  aniDefteri: 64,
  aktifMisafir: 138,
  bekleyenOnay: 7,
};

// Saatlik aktivite (mock — basit bar grafik için)
export const saatlikAktivite = [
  { saat: "18:00", deger: 22 },
  { saat: "19:00", deger: 58 },
  { saat: "20:00", deger: 96 },
  { saat: "21:00", deger: 140 },
  { saat: "22:00", deger: 88 },
  { saat: "23:00", deger: 51 },
  { saat: "00:00", deger: 27 },
];
