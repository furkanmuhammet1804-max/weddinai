// =============================================================
// AI hız limiti (Faz 0) — YALNIZCA SUNUCU TARAFI.
//
// Public AI rotaları para harcar; kötüye kullanımı sınırlamak için IP başına
// kayan pencere limiti uygulanır. Sayım ai_islem_log üzerinden yapılır:
// serverless ortamda örnekler arası bellek paylaşılmadığından, DB tabanlı
// sayım tek doğru yaklaşımdır (ve loglama zaten her isteği yazıyor).
//
// Not: limit kontrolü, isteğin KENDİSİ loglanmadan ÖNCE çağrılır; yani pencere
// içinde geçmiş N istek sayılır, N'inci istekten sonrası reddedilir.
// =============================================================
import { createAdminClient } from "@/lib/supabase/admin";
import type { AiIslemTip } from "@/lib/ai/types";

export interface RateLimitSecenek {
  limit: number; // pencere başına izin verilen istek
  pencereSn: number; // pencere uzunluğu (saniye)
}

export interface RateLimitSonuc {
  izin: boolean;
  kalan: number; // bu pencerede kalan hak (tahmini)
  yenidenSn?: number; // tekrar denenebileceği yaklaşık süre (saniye)
}

// IP'yi istek başlıklarından güvenli biçimde çıkarır (Vercel/proxy uyumlu).
export function istekIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("cf-connecting-ip") ??
    "bilinmiyor"
  );
}

// IP + işlem türü için kayan pencerede limit kontrolü.
// Hata olursa (DB erişilemezse) güvenli tarafta kalıp İZİN VERİR — loglama ve
// limit, AI özelliğini tümden kilitlememeli.
export async function rateLimitKontrol(
  ip: string,
  islemTip: AiIslemTip,
  secenek: RateLimitSecenek,
): Promise<RateLimitSonuc> {
  const { limit, pencereSn } = secenek;
  if (!ip || ip === "bilinmiyor") {
    // IP yoksa konservatif davran ama engelleme; sadece tek hak ver.
    return { izin: true, kalan: Math.max(0, limit - 1) };
  }
  try {
    const admin = createAdminClient();
    const esik = new Date(Date.now() - pencereSn * 1000).toISOString();
    const { count, error } = await admin
      .from("ai_islem_log")
      .select("id", { count: "exact", head: true })
      .eq("ip", ip)
      .eq("islem_tip", islemTip)
      .gte("created_at", esik);
    if (error) {
      console.error("[ai] rate-limit sorgu hatası", error.message);
      return { izin: true, kalan: 0 };
    }
    const mevcut = count ?? 0;
    if (mevcut >= limit) {
      return { izin: false, kalan: 0, yenidenSn: pencereSn };
    }
    return { izin: true, kalan: Math.max(0, limit - mevcut - 1) };
  } catch (e) {
    console.error("[ai] rate-limit istisnası", e);
    return { izin: true, kalan: 0 };
  }
}
