// =============================================================
// AI prompt'ları (Faz 0 — merkezî tanım, Faz 1+ büyür).
// Her prompt { system, user, jsonSema } döner; rota bunu metinUret'e geçirir.
// =============================================================
import type { DavetiyeOneriGirdi } from "@/lib/ai/types";
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
