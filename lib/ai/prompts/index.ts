// =============================================================
// AI prompt'ları (Faz 0 — merkezî tanım, Faz 1+ büyür).
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

// Davetiye öneri asistanı: çifte 3 farklı, zarif, Türkçe davet metni önerir.
export function davetiyeOneriPrompt(g: DavetiyeOneriGirdi): PromptCikti {
  const tema = temaBul(g.tema);
  const tonMetni = g.ton?.trim() || "zarif ve sıcak";

  const system = [
    "Sen, premium dijital düğün davetiyeleri için Türkçe yazan usta bir metin yazarısın.",
    "Görevin: çiftin bilgilerinden yola çıkarak davetiyede kullanılacak KISA davet metinleri yazmak.",
    "",
    "Kurallar:",
    "- Her metin 2–4 cümle olsun; doğal, akıcı ve duygusal ama abartısız.",
    "- Klişe ve yapay kalıplardan kaçın ('iki gönül bir oldu' gibi aşırı kullanılmış ifadeleri tekrarlama).",
    "- İsimleri olduğu gibi kullan; uydurma bilgi (tarih, mekân) EKLEME.",
    "- Misafiri törene davet eden, içten bir ton kullan.",
    "- Üç öneri birbirinden belirgin biçimde FARKLI olsun (biri klasik, biri modern, biri şiirsel gibi).",
    "- Emoji kullanma. Tırnak işaretiyle sarma.",
  ].join("\n");

  const satirlar: string[] = [
    `Gelin: ${g.gelin_ad}`,
    `Damat: ${g.damat_ad}`,
    `Davetiye teması: ${tema.ad}`,
    `İstenen ton: ${tonMetni}`,
  ];
  if (g.tarih?.trim()) satirlar.push(`Tarih: ${g.tarih.trim()}`);
  if (g.detay?.trim()) satirlar.push(`Çiftin notu: ${g.detay.trim()}`);

  const user = [
    "Aşağıdaki çift için davetiyede kullanılacak 3 farklı davet metni öner.",
    "",
    satirlar.join("\n"),
    "",
    'Yanıtı yalnızca şu JSON biçiminde ver: {"oneriler": ["metin1", "metin2", "metin3"]}',
  ].join("\n");

  const jsonSema = {
    type: "object",
    properties: {
      oneriler: {
        type: "array",
        items: { type: "string" },
      },
    },
    required: ["oneriler"],
    additionalProperties: false,
  };

  return { system, user, jsonSema };
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

// Tona göre yazım rehberi (Özellik 1).
const TEBRIK_TON_REHBER: Record<string, string> = {
  Kısa: "Çok kısa ve öz (1 cümle, en fazla 12-15 kelime), vurucu bir dilek.",
  Samimi: "Sıcak, içten, sen diliyle; gündelik ve candan bir tebrik.",
  Duygusal: "Duygu yüklü, dokunaklı ama abartısız; içtenlikle dilek dolu.",
  Resmi: "Saygılı, zarif ve resmi bir dille; nazik tebrik ve iyi dilekler.",
  Komik: "Esprili, neşeli, gülümseten; kırıcı olmayan tatlı bir mizah.",
};

// Özellik 1 — Tebrik mesajı asistanı: misafire 3 farklı tebrik/dilek önerir.
export function tebrikOneriPrompt(g: TebrikOneriGirdi): PromptCikti {
  const rehber = TEBRIK_TON_REHBER[g.ton] ?? TEBRIK_TON_REHBER.Samimi;

  const system = [
    "Sen, düğün/nişan için Türkçe içten tebrik ve dilek mesajları yazan bir yardımcısın.",
    "Görevin: misafirin çifte bırakacağı KISA tebrik mesajları yazmak.",
    "",
    "Kurallar:",
    `- İstenen ton: ${rehber}`,
    "- Her öneri tek bir mesaj olsun; doğal ve akıcı Türkçe.",
    "- Aşırı klişe kalıplardan kaçın; samimi ve özgün ol.",
    "- Uydurma kişisel bilgi EKLEME. Tırnak işaretiyle sarma.",
    "- Üç öneri birbirinden belirgin biçimde FARKLI olsun.",
    g.ton === "Komik"
      ? "- Mizah tatlı ve kapsayıcı olsun; kimseyle dalga geçme."
      : "- Emoji kullanma.",
  ].join("\n");

  const satirlar: string[] = [];
  if (g.cift_ad?.trim()) satirlar.push(`Çift: ${g.cift_ad.trim()}`);
  if (g.iliski?.trim())
    satirlar.push(`Mesajı yazan kişinin çifte yakınlığı: ${g.iliski.trim()}`);
  if (satirlar.length === 0)
    satirlar.push("(Çift adı verilmedi — genel ama içten yaz.)");

  const user = [
    `Aşağıdaki bilgilerle "${g.ton}" tonunda 3 farklı tebrik mesajı öner.`,
    "",
    satirlar.join("\n"),
    "",
    'Yanıtı yalnızca şu JSON biçiminde ver: {"oneriler": ["mesaj1", "mesaj2", "mesaj3"]}',
  ].join("\n");

  return { system, user, jsonSema: { ...ONERILER_SEMA } };
}

// Kategoriye göre yazım rehberi (Özellik 2).
const NOT_KATEGORI_REHBER: Record<string, { etiket: string; yonerge: string }> =
  {
    hikaye: {
      etiket: "Çift hikâyesi",
      yonerge:
        "Çiftin tanışma/birliktelik hikâyesini anlatan, davetiyede kullanılabilecek kısa ve duygusal paragraflar.",
    },
    aciklama: {
      etiket: "Davetiye açıklaması",
      yonerge:
        "Davetiyeye eklenecek kısa açıklama/karşılama metni (misafirleri törene davet eden zarif ifadeler).",
    },
    tasarim: {
      etiket: "Tasarım/özel istek notu",
      yonerge:
        "Tasarım ekibine iletilecek, davetiyenin tarzına dair somut ve uygulanabilir istek notları (renk, atmosfer, tema tonu).",
    },
  };

// Özellik 2 — Davetiye not yardımcısı: talep formundaki nota 3 öneri üretir.
export function davetiyeNotPrompt(g: DavetiyeNotGirdi): PromptCikti {
  const k = NOT_KATEGORI_REHBER[g.kategori] ?? NOT_KATEGORI_REHBER.aciklama;

  const system = [
    "Sen, premium dijital düğün davetiyeleri için Türkçe yazan bir metin yazarısın.",
    `Görevin: çiftin talep formundaki notu için "${k.etiket}" önerileri yazmak.`,
    "",
    "Kurallar:",
    `- İçerik: ${k.yonerge}`,
    "- Her öneri 2–4 cümle; doğal, akıcı, zarif ve abartısız.",
    "- Uydurma bilgi (tarih, mekân, isim) EKLEME; verilenle yetin.",
    "- Klişelerden kaçın. Emoji kullanma. Tırnak işaretiyle sarma.",
    "- Üç öneri birbirinden belirgin biçimde FARKLI olsun.",
  ].join("\n");

  const satirlar: string[] = [];
  if (g.gelin_ad?.trim()) satirlar.push(`Gelin: ${g.gelin_ad.trim()}`);
  if (g.damat_ad?.trim()) satirlar.push(`Damat: ${g.damat_ad.trim()}`);
  if (g.ipucu?.trim()) satirlar.push(`Çiftin ipucu/isteği: ${g.ipucu.trim()}`);
  if (satirlar.length === 0)
    satirlar.push("(Ek bilgi verilmedi — genel ama zarif yaz.)");

  const user = [
    `Aşağıdaki bilgilerle "${k.etiket}" için 3 farklı öneri yaz.`,
    "",
    satirlar.join("\n"),
    "",
    'Yanıtı yalnızca şu JSON biçiminde ver: {"oneriler": ["metin1", "metin2", "metin3"]}',
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

export function hatiraDefteriPrompt(g: HatiraPromptGirdi): {
  system: string;
  user: string;
} {
  const system = [
    "Sen, düğün/etkinlik için Türkçe yazan duygusal ve zarif bir editörsün.",
    "Görevin: misafirlerin bıraktığı mesajlardan akıcı bir 'Hatıra Defteri' metni oluşturmak.",
    "",
    "Kurallar:",
    "- Sıcak, içten, akıcı bir anlatı kur; mesajları temalara göre harmanla.",
    "- Bölüm başlıkları kullan (örn. 'Sevgiyle Gelen Dilekler', 'Unutulmaz Anlar').",
    "- Misafir mesajlarındaki duyguyu koru; uydurma olay/isim EKLEME.",
    "- Kaba/uygunsuz ifadeleri yumuşat veya çıkar. Emoji kullanma.",
    "- Düz metin yaz (Markdown başlıkları '## ' kullanılabilir). 250-500 kelime civarı.",
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
