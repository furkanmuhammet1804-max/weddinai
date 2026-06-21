// =============================================================
// AI prompt'ları — DOĞALLIK REVİZYONU (F1/F2/F3).
// Hedef: çıktı "yapay zekâ yazmış" gibi değil, "gerçekten biri yazmış gibi"
// görünsün. Bunun için: (1) klişe yasak listesi, (2) her üretimde RASTGELE ton +
// açı seçimi (aynı girdi → farklı çıktı), (3) doğal/konuşma dili Türkçesi.
// Her prompt { system, user, jsonSema } döner; rota bunu metinUret'e geçirir.
// =============================================================
import type {
  DavetiyeOneriGirdi,
  TebrikOneriGirdi,
  DavetiyeNotGirdi,
} from "@/lib/ai/types";
import { temaBul } from "@/lib/davetiye-tema";

export interface PromptCikti {
  system: string;
  user: string;
  jsonSema: Record<string, unknown>;
}

// ---- Rastgele seçim yardımcıları (her çağrıda farklı çıktı için) ----
function karistir<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function rastgeleSec<T>(arr: readonly T[], n: number): T[] {
  return karistir(arr).slice(0, n);
}

// ---- 9 ton (kullanıcı isteği) — her biri kısa karakter tarifi ----
const TON_HAVUZ: { ad: string; tarif: string }[] = [
  { ad: "Samimi", tarif: "sıcak, içten, sen diliyle; sanki yakın bir dost yazmış gibi" },
  { ad: "Eğlenceli", tarif: "neşeli, enerjik, hafif; gülümseten bir hava" },
  { ad: "Duygusal", tarif: "dokunaklı ve içten; abartıya kaçmadan duyguyu hissettiren" },
  { ad: "Kısa ve sıcak", tarif: "tek-iki cümle, az ama öz, candan" },
  { ad: "Kankaca", tarif: "samimi, esprili, gündelik konuşma dili; teklifsiz ama tatlı" },
  { ad: "Aile büyüğü gibi", tarif: "şefkatli, olgun, hayır dua eden bir büyüğün sesi" },
  { ad: "Zarif", tarif: "ince, sade, asil; süse boğmadan zarif" },
  { ad: "Modern", tarif: "güncel, sade, net; klişesiz çağdaş bir dil" },
  { ad: "Mizahi", tarif: "tatlı bir espriyle gülümseten; kırıcı değil kapsayıcı" },
];

// ---- Klişe yasak listesi — bu kalıpları KULLANMA ----
const KLISE_YASAK = [
  "Bu özel gününüzde",
  "Ömür boyu mutluluklar",
  "Bir ömür boyu sevgi",
  "Hayatınızın en güzel günü",
  "Mutluluklar dileriz",
  "İki gönül bir oldu",
  "Bir yastıkta kocayın",
  "Ömür boyu mutluluk",
  "Sonsuz mutluluk",
  "Sevgi dolu bir ömür",
];

// Tüm yaratıcı promptlarda ortak doğallık kuralları.
function dogallikKurallari(): string {
  return [
    "DOĞALLIK KURALLARI (çok önemli):",
    "- Gerçek bir insanın yazdığı gibi yaz; yapay/şablon kokmasın.",
    "- Şu klişeleri ASLA kullanma: " + KLISE_YASAK.map((k) => `\"${k}\"`).join(", ") + ".",
    "- Süslü, abartılı, ağdalı dilden kaçın; sade ve doğal Türkçe kullan.",
    "- Her öneri farklı bir cümleyle başlasın ve farklı bir kapanışı olsun.",
    "- Kısa mesajlarda konuşma dilini tercih et (gündelik, akıcı).",
    "- Uydurma bilgi (tarih, mekân, isim) EKLEME; verilenle yetin.",
    "- Tırnak işaretiyle sarma. Hashtag kullanma.",
  ].join("\n");
}

// Ortak: {"oneriler": [...]} biçimini bekleyen JSON şeması.
const ONERILER_SEMA = {
  type: "object",
  properties: {
    oneriler: { type: "array", items: { type: "string" } },
  },
  required: ["oneriler"],
  additionalProperties: false,
} as const;

// Davetiye öneri asistanı: çifte 3 farklı, doğal, Türkçe davet metni önerir.
export function davetiyeOneriPrompt(g: DavetiyeOneriGirdi): PromptCikti {
  const tema = temaBul(g.tema);
  // Her üretimde 3 farklı ton seç → aynı çiftte bile farklı çıktı.
  const tonlar = rastgeleSec(TON_HAVUZ, 3);

  const system = [
    "Sen, gerçek çiftler adına Türkçe davet metni yazan, sıcak ve doğal bir metin yazarısın.",
    "Görevin: çiftin bilgilerinden, misafiri törene davet eden KISA metinler yazmak.",
    "Metin kurumsal değil; çiftin kendi ağzından, içten yazılmış gibi olmalı.",
    "",
    dogallikKurallari(),
    "- Her metin 2–4 cümle; davet eden, içten ama abartısız.",
    "- Emoji kullanma.",
  ].join("\n");

  const satirlar: string[] = [
    `Gelin: ${g.gelin_ad}`,
    `Damat: ${g.damat_ad}`,
    `Davetiye teması: ${tema.ad}`,
  ];
  if (g.tarih?.trim()) satirlar.push(`Tarih: ${g.tarih.trim()}`);
  if (g.detay?.trim()) satirlar.push(`Çiftin notu: ${g.detay.trim()}`);

  const user = [
    "Aşağıdaki çift için davetiyede kullanılacak 3 farklı davet metni yaz.",
    "Her metni FARKLI bir tonda yaz:",
    tonlar.map((t, i) => `${i + 1}. ${t.ad} — ${t.tarif}`).join("\n"),
    "",
    satirlar.join("\n"),
    "",
    'Yanıtı yalnızca şu JSON ile ver: {"oneriler": ["metin1", "metin2", "metin3"]}',
  ].join("\n");

  return { system, user, jsonSema: { ...ONERILER_SEMA } };
}

// Özellik 1 — Tebrik mesajı asistanı: misafire 3 farklı tebrik/dilek önerir.
// Kullanıcı bir ana ton seçer; çeşitlilik için 3 öneri farklı AÇILARDAN yazılır.
const TEBRIK_ACILAR = [
  "ortak bir anıya/iç şakaya gönderme yapan",
  "çifte içten bir dilek ileten",
  "geleceğe dair umutlu, sıcak bir temenni",
  "kısa ve vurucu, tek nefeslik",
  "biraz esprili, gülümseten",
  "duyguyu öne çıkaran, samimi",
  "sade ve modern, klişesiz",
];

export function tebrikOneriPrompt(g: TebrikOneriGirdi): PromptCikti {
  const tonAd = g.ton?.trim() || "Samimi";
  // Aynı tonda bile 3 öneri farklı açıdan → her üretimde değişir.
  const acilar = rastgeleSec(TEBRIK_ACILAR, 3);

  const system = [
    "Sen, düğün/nişan için gerçek insanların yazdığı gibi içten Türkçe tebrik mesajları yazan birisin.",
    "Görevin: misafirin çifte bırakacağı KISA tebrik mesajları yazmak.",
    "",
    dogallikKurallari(),
    `- Ana ton: ${tonAd}. Bu tonu koru ama 3 öneriyi farklı açılardan yaz.`,
    tonAd === "Komik" || tonAd === "Mizahi"
      ? "- Mizah tatlı ve kapsayıcı olsun; kimseyle dalga geçme."
      : "- Emoji kullanma.",
    "- Her öneri tek bir mesaj olsun; doğal, akıcı, konuşma dilinde.",
  ].join("\n");

  const satirlar: string[] = [];
  if (g.cift_ad?.trim()) satirlar.push(`Çift: ${g.cift_ad.trim()}`);
  if (g.iliski?.trim())
    satirlar.push(`Mesajı yazan kişinin çifte yakınlığı: ${g.iliski.trim()}`);
  if (satirlar.length === 0)
    satirlar.push("(Çift adı verilmedi — genel ama içten yaz.)");

  const user = [
    `"${tonAd}" tonunda 3 farklı tebrik mesajı yaz. Her biri şu açıdan olsun:`,
    acilar.map((a, i) => `${i + 1}. ${a}`).join("\n"),
    "",
    satirlar.join("\n"),
    "",
    'Yanıtı yalnızca şu JSON ile ver: {"oneriler": ["mesaj1", "mesaj2", "mesaj3"]}',
  ].join("\n");

  return { system, user, jsonSema: { ...ONERILER_SEMA } };
}

// Kategoriye göre yazım rehberi (Özellik 2).
const NOT_KATEGORI_REHBER: Record<string, { etiket: string; yonerge: string }> =
  {
    hikaye: {
      etiket: "Çift hikâyesi",
      yonerge:
        "Çiftin tanışma/birliktelik hikâyesini anlatan, davetiyede kullanılabilecek kısa ve içten paragraflar.",
    },
    aciklama: {
      etiket: "Davet metni",
      yonerge:
        "Misafiri törene davet eden, çiftin kendi ağzından yazılmış gibi sıcak karşılama metni.",
    },
    tasarim: {
      etiket: "Tasarım/özel istek notu",
      yonerge:
        "Tasarım ekibine iletilecek, davetiyenin tarzına dair somut istek notları (renk, atmosfer, tema tonu).",
    },
  };

// Özellik 2 — Davetiye not yardımcısı: talep formundaki nota 3 öneri üretir.
export function davetiyeNotPrompt(g: DavetiyeNotGirdi): PromptCikti {
  const k = NOT_KATEGORI_REHBER[g.kategori] ?? NOT_KATEGORI_REHBER.aciklama;
  // Tasarım notu hariç, metinleri farklı tonlarda çeşitlendir.
  const tonlar = rastgeleSec(TON_HAVUZ, 3);

  const system = [
    `Sen, gerçek çiftler adına Türkçe yazan doğal bir metin yazarısın.`,
    `Görevin: çiftin talep formundaki notu için "${k.etiket}" önerileri yazmak.`,
    "Kurumsal/şablon değil; gerçek bir çiftin yazdığı hissini ver.",
    "",
    dogallikKurallari(),
    `- İçerik: ${k.yonerge}`,
    "- Her öneri 2–4 cümle; doğal ve akıcı.",
    "- Emoji kullanma.",
  ].join("\n");

  const satirlar: string[] = [];
  if (g.gelin_ad?.trim()) satirlar.push(`Gelin: ${g.gelin_ad.trim()}`);
  if (g.damat_ad?.trim()) satirlar.push(`Damat: ${g.damat_ad.trim()}`);
  if (g.ipucu?.trim()) satirlar.push(`Çiftin ipucu/isteği: ${g.ipucu.trim()}`);
  if (satirlar.length === 0)
    satirlar.push("(Ek bilgi verilmedi — genel ama içten yaz.)");

  const tonSatiri =
    g.kategori === "tasarim"
      ? "Üç öneri birbirinden belirgin biçimde farklı olsun."
      : "Her öneriyi farklı bir tonda yaz:\n" +
        tonlar.map((t, i) => `${i + 1}. ${t.ad} — ${t.tarif}`).join("\n");

  const user = [
    `Aşağıdaki bilgilerle "${k.etiket}" için 3 farklı öneri yaz.`,
    tonSatiri,
    "",
    satirlar.join("\n"),
    "",
    'Yanıtı yalnızca şu JSON ile ver: {"oneriler": ["metin1", "metin2", "metin3"]}',
  ].join("\n");

  return { system, user, jsonSema: { ...ONERILER_SEMA } };
}

// Özellik 3 — Hatıra defteri taslağı (uzun-biçim metin; JSON şeması YOK).
// Güvenlik: yalnızca misafir MESAJLARI (metin) verilir; foto/video/iletişim
// bilgisi AI'ya GÖNDERİLMEZ. system+user döner; jsonSema boş bırakılır.
export interface HatiraPromptGirdi {
  etkinlikBaslik: string;
  mesajlar: string[];
}

// Hatıra defteri bölüm başlığı havuzu — her üretimde farklı kombinasyon.
const HATIRA_BASLIK_HAVUZ = [
  "Sevgiyle Gelen Dilekler",
  "O Günden Kalanlar",
  "Gülümseten Satırlar",
  "Yürekten Notlar",
  "Birlikte Yazdığımız An",
  "Misafirlerimizden",
  "Hatıralara Düşülen Notlar",
];

export function hatiraDefteriPrompt(g: HatiraPromptGirdi): {
  system: string;
  user: string;
} {
  const basliklar = rastgeleSec(HATIRA_BASLIK_HAVUZ, 3);

  const system = [
    "Sen, bir düğünün hatıra defterini gerçek bir insanın kaleminden yazan, sıcak ve doğal bir editörsün.",
    "Görevin: misafirlerin bıraktığı mesajlardan akıcı, içten bir 'Hatıra Defteri' metni oluşturmak.",
    "Robotik/şablon değil; sanki çiftin yakın bir dostu kaleme almış gibi olsun.",
    "",
    dogallikKurallari(),
    "- Mesajları temalara göre harmanla; tek tek sıralama, bir anlatı kur.",
    `- Bölüm başlıkları kullan (örn. ${basliklar.map((b) => `'${b}'`).join(", ")}); '## ' ile yaz.`,
    "- Misafir mesajlarındaki duyguyu koru; uydurma olay/isim EKLEME.",
    "- Kaba/uygunsuz ifadeleri yumuşat veya çıkar. Emoji kullanma.",
    "- 250-500 kelime civarı, gerçek anı dili kullan.",
  ].join("\n");

  const mesajBloku =
    g.mesajlar.length > 0
      ? g.mesajlar.map((m, i) => `${i + 1}. ${m}`).join("\n")
      : "(Henüz misafir mesajı yok — genel ama içten bir hatıra metni yaz.)";

  const user = [
    `Etkinlik: ${g.etkinlikBaslik}`,
    "",
    "Aşağıdaki misafir mesajlarından bir hatıra defteri metni oluştur:",
    "",
    mesajBloku,
  ].join("\n");

  return { system, user };
}
