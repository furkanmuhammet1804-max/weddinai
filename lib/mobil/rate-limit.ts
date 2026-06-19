// Basit, bellek-içi sliding-window rate limiter (sıfır ek altyapı).
//
// NOT: Vercel serverless'te örnekler belleği PAYLAŞMAZ; bu limiter tek bir
// örneğe gelen hızlı brute-force'u frenler ama dağıtık/çok-örnekli saldırıya
// tam çözüm DEĞİLDİR. Production-grade dağıtık koruma için Upstash Redis veya
// Supabase tabanlı sayaç (atomik) önerilir. bcrypt'in yavaşlığıyla birlikte
// bu, ilk savunma katmanı olarak makul bir eşik sağlar.

type ZamanDamgalari = number[];
const depo = new Map<string, ZamanDamgalari>();

export interface LimitSonuc {
  izin: boolean;
  kalanSn: number; // izin=false ise Retry-After değeri
}

export function rateLimit(
  anahtar: string,
  limit: number,
  pencereMs: number,
): LimitSonuc {
  const simdi = Date.now();
  const bas = simdi - pencereMs;
  const liste = (depo.get(anahtar) ?? []).filter((t) => t > bas);

  if (liste.length >= limit) {
    const kalanMs = Math.max(0, liste[0] + pencereMs - simdi);
    depo.set(anahtar, liste);
    return { izin: false, kalanSn: Math.ceil(kalanMs / 1000) || 1 };
  }

  liste.push(simdi);
  depo.set(anahtar, liste);
  if (depo.size > 5000) temizle(bas);
  return { izin: true, kalanSn: 0 };
}

function temizle(bas: number): void {
  for (const [k, v] of depo) {
    const f = v.filter((t) => t > bas);
    if (f.length === 0) depo.delete(k);
    else depo.set(k, f);
  }
}

// Vercel arkasında gerçek istemci IP'si x-forwarded-for'un ilk değeridir.
export function istemciIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return request.headers.get("x-real-ip")?.trim() || "bilinmeyen";
}
