// =============================================================
// Gemini sağlayıcı (Faz 0) — YALNIZCA SUNUCU TARAFI.
// Google Generative Language REST API (v1beta) üzerinden çağrı yapar.
// Anahtar: GEMINI_API_KEY. Varsayılan model: gemini-2.5-flash.
// Ekstra SDK bağımlılığı yok — fetch yeterli (Node 18+).
// =============================================================
import type {
  AiSaglayici,
  UretimSecenek,
  UretimSonuc,
  GorselSiniflaSecenek,
  GorselSiniflaSonuc,
} from "@/lib/ai/providers/types";

export const GEMINI_VARSAYILAN_MODEL = "gemini-2.5-flash";

const TABAN_URL = "https://generativelanguage.googleapis.com/v1beta/models";

// Sağlayıcıdan bağımsız JSON-Schema'yı Gemini responseSchema biçimine çevirir.
// (Gemini, OpenAPI tarzı büyük harfli "type" bekler ve additionalProperties'i
// desteklemez; bu yüzden onu yok sayarız.)
function semaCevir(s: Record<string, unknown>): Record<string, unknown> {
  const tip = typeof s.type === "string" ? s.type.toLowerCase() : "string";
  switch (tip) {
    case "object": {
      const ozellikler: Record<string, unknown> = {};
      const props = (s.properties ?? {}) as Record<
        string,
        Record<string, unknown>
      >;
      for (const [k, v] of Object.entries(props)) ozellikler[k] = semaCevir(v);
      const cikti: Record<string, unknown> = {
        type: "OBJECT",
        properties: ozellikler,
      };
      if (Array.isArray(s.required)) cikti.required = s.required;
      return cikti;
    }
    case "array":
      return {
        type: "ARRAY",
        items: semaCevir((s.items ?? { type: "string" }) as Record<string, unknown>),
      };
    case "integer":
      return { type: "INTEGER" };
    case "number":
      return { type: "NUMBER" };
    case "boolean":
      return { type: "BOOLEAN" };
    default:
      return { type: "STRING" };
  }
}

interface GeminiYanit {
  candidates?: {
    content?: { parts?: { text?: string }[] };
    finishReason?: string;
  }[];
  promptFeedback?: { blockReason?: string };
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    thoughtsTokenCount?: number;
  };
}

async function metinUret(opts: UretimSecenek): Promise<UretimSonuc> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY tanımlı değil.");
  const model = opts.model ?? GEMINI_VARSAYILAN_MODEL;

  const generationConfig: Record<string, unknown> = {
    maxOutputTokens: opts.maxTokens ?? 2048,
    // 2.5 Flash bir "thinking" modelidir; kısa JSON üretiminde düşünme
    // bütçesini kapatmak hem maliyeti hem de çıktı bütçesi taşma riskini düşürür.
    thinkingConfig: { thinkingBudget: 0 },
  };
  if (opts.jsonSema) {
    generationConfig.responseMimeType = "application/json";
    generationConfig.responseSchema = semaCevir(opts.jsonSema);
  }

  const govde = {
    systemInstruction: { parts: [{ text: opts.system }] },
    contents: [{ role: "user", parts: [{ text: opts.user }] }],
    generationConfig,
  };

  const res = await fetch(`${TABAN_URL}/${model}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(govde),
  });

  if (!res.ok) {
    const detay = await res.text().catch(() => "");
    throw new Error(`Gemini ${res.status}: ${detay.slice(0, 300)}`);
  }

  const veri = (await res.json()) as GeminiYanit;

  if (veri.promptFeedback?.blockReason) {
    throw new Error(`Gemini engelledi: ${veri.promptFeedback.blockReason}`);
  }

  const cand = veri.candidates?.[0];
  const metin = (cand?.content?.parts ?? [])
    .map((p) => p.text ?? "")
    .join("")
    .trim();

  const u = veri.usageMetadata;
  return {
    metin,
    model,
    inputToken: u?.promptTokenCount ?? 0,
    // Düşünme token'ları da çıktı olarak ücretlendirilir.
    outputToken: (u?.candidatesTokenCount ?? 0) + (u?.thoughtsTokenCount ?? 0),
  };
}

// Görsel sınıflandırma — TEK fotoğrafı verilen kategorilerden birine atar.
// Yalnızca kategori için kullanılır (Güvenlik Politikası §5: minimum veri).
async function gorselSinifla(
  opts: GorselSiniflaSecenek,
): Promise<GorselSiniflaSonuc> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY tanımlı değil.");
  const model = opts.model ?? GEMINI_VARSAYILAN_MODEL;

  const system =
    "Sen bir düğün/etkinlik fotoğrafı sınıflandırıcısısın. Verilen fotoğrafı, izin verilen kategorilerden EN UYGUN olan tek birine ata.";
  const user =
    `Bu fotoğrafı şu kategorilerden birine sınıflandır: ${opts.kategoriler.join(", ")}.` +
    ' Yalnızca şu JSON ile yanıt ver: {"kategori": "<kategori>"}';

  const govde = {
    systemInstruction: { parts: [{ text: system }] },
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType: opts.mimeType, data: opts.imageBase64 } },
          { text: user },
        ],
      },
    ],
    generationConfig: {
      maxOutputTokens: 200,
      thinkingConfig: { thinkingBudget: 0 },
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: { kategori: { type: "STRING", enum: opts.kategoriler } },
        required: ["kategori"],
      },
    },
  };

  const res = await fetch(`${TABAN_URL}/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify(govde),
  });
  if (!res.ok) {
    const detay = await res.text().catch(() => "");
    throw new Error(`Gemini ${res.status}: ${detay.slice(0, 300)}`);
  }
  const veri = (await res.json()) as GeminiYanit;
  if (veri.promptFeedback?.blockReason) {
    throw new Error(`Gemini engelledi: ${veri.promptFeedback.blockReason}`);
  }
  const metin = (veri.candidates?.[0]?.content?.parts ?? [])
    .map((p) => p.text ?? "")
    .join("")
    .trim();

  let kategori: string | null = null;
  try {
    const j = JSON.parse(metin) as { kategori?: unknown };
    if (typeof j.kategori === "string" && opts.kategoriler.includes(j.kategori)) {
      kategori = j.kategori;
    }
  } catch {
    /* kategori null kalır */
  }

  const u = veri.usageMetadata;
  return {
    kategori,
    model,
    inputToken: u?.promptTokenCount ?? 0,
    outputToken: (u?.candidatesTokenCount ?? 0) + (u?.thoughtsTokenCount ?? 0),
  };
}

export const geminiSaglayici: AiSaglayici = {
  ad: "gemini",
  varsayilanModel: GEMINI_VARSAYILAN_MODEL,
  metinUret,
  gorselSinifla,
};
