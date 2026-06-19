// =============================================================
// Anthropic istemcisi (Faz 0) — YALNIZCA SUNUCU TARAFI.
// Resmi @anthropic-ai/sdk kullanılır. API anahtarı env'den okunur.
// Varsayılan model: Claude Opus 4.8 (en yetenekli model).
// =============================================================
import Anthropic from "@anthropic-ai/sdk";
import type { AiKullanim } from "@/lib/ai/types";

export const VARSAYILAN_MODEL = "claude-opus-4-8";

let _client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY tanımlı değil.");
  }
  if (!_client) _client = new Anthropic({ apiKey });
  return _client;
}

export interface UretimSecenek {
  system: string;
  user: string;
  model?: string;
  maxTokens?: number;
  // Verilirse yanıt bu JSON şemasına uydurulur (structured outputs).
  jsonSema?: Record<string, unknown>;
}

export interface UretimSonuc extends AiKullanim {
  metin: string;
  model: string;
}

// Tek seferlik metin üretimi. Yanıt metnini ve token kullanımını döner.
// jsonSema verilirse output_config.format ile yapılandırılmış JSON üretilir.
export async function metinUret(opts: UretimSecenek): Promise<UretimSonuc> {
  const client = getAnthropic();
  const model = opts.model ?? VARSAYILAN_MODEL;

  const istek: Record<string, unknown> = {
    model,
    max_tokens: opts.maxTokens ?? 1500,
    system: opts.system,
    messages: [{ role: "user", content: opts.user }],
  };
  if (opts.jsonSema) {
    istek.output_config = {
      format: { type: "json_schema", schema: opts.jsonSema },
    };
  }

  // SDK tipleri output_config'i henüz dar tutuyor; istek gövdesi API ile uyumlu.
  // stream geçmiyoruz → yanıt her zaman Message.
  const yanit = (await client.messages.create(
    istek as unknown as Parameters<typeof client.messages.create>[0],
  )) as Anthropic.Message;

  const metin = yanit.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  return {
    metin,
    model,
    inputToken: yanit.usage?.input_tokens ?? 0,
    outputToken: yanit.usage?.output_tokens ?? 0,
  };
}
