// =============================================================
// AI maliyet hesabı (Faz 0).
// Fiyatlar 1.000.000 token başına USD cinsindendir.
// Kaynak: Google Gemini API fiyatlandırması (yaklaşık; teşhis amaçlı).
//   gemini-2.5-flash:      $0.30 girdi / $2.50 çıktı
//   gemini-2.5-flash-lite: $0.10 girdi / $0.40 çıktı
//   gemini-2.5-pro:        $1.25 girdi / $10.00 çıktı
// =============================================================

interface ModelFiyat {
  input: number; // USD / 1M girdi token
  output: number; // USD / 1M çıktı token
}

const MODEL_FIYAT: Record<string, ModelFiyat> = {
  "gemini-2.5-flash": { input: 0.3, output: 2.5 },
  "gemini-2.5-flash-lite": { input: 0.1, output: 0.4 },
  "gemini-2.5-pro": { input: 1.25, output: 10 },
};

// Bilinmeyen modelde aktif varsayılan (Flash) tarifesini taban alır.
const VARSAYILAN_FIYAT: ModelFiyat = MODEL_FIYAT["gemini-2.5-flash"];

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
