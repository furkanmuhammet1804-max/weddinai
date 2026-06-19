// =============================================================
// AI maliyet hesabı (Faz 0).
// Anthropic fiyatları 1.000.000 token başına USD cinsindendir.
// Kaynak: platform.claude.com fiyatlandırma (Opus 4.8: $5 girdi / $25 çıktı).
// =============================================================

interface ModelFiyat {
  input: number; // USD / 1M girdi token
  output: number; // USD / 1M çıktı token
}

const MODEL_FIYAT: Record<string, ModelFiyat> = {
  "claude-opus-4-8": { input: 5, output: 25 },
  "claude-opus-4-7": { input: 5, output: 25 },
  "claude-sonnet-4-6": { input: 3, output: 15 },
  "claude-haiku-4-5": { input: 1, output: 5 },
};

// Bilinmeyen modelde Opus 4.8 fiyatını taban alır (maliyeti olduğundan az
// göstermemek için en yüksek Opus tarifesi).
const VARSAYILAN_FIYAT: ModelFiyat = MODEL_FIYAT["claude-opus-4-8"];

// Verilen model + token sayılarına göre tahmini USD maliyet.
export function maliyetHesapla(
  model: string,
  inputToken: number,
  outputToken: number,
): number {
  const f = MODEL_FIYAT[model] ?? VARSAYILAN_FIYAT;
  const usd =
    (inputToken / 1_000_000) * f.input +
    (outputToken / 1_000_000) * f.output;
  // 6 ondalık (mikro-dolar) hassasiyetinde yuvarla.
  return Math.round(usd * 1_000_000) / 1_000_000;
}

export function maliyetFormatla(usd: number): string {
  if (usd < 0.01) return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(2)}`;
}
