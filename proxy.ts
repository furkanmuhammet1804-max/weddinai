// Next.js 16 kök "proxy" (eski adıyla middleware) — her istekte oturumu tazeler
// ve /panel'i girişsiz erişime kapatır. Asıl mantık lib/supabase/middleware.ts'te.
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // API rotaları, statik dosyalar, resim optimizasyonu ve metadata hariç
    // tüm yollarda çalış (resim uzantıları büyük/küçük harf duyarsız).
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|avif)$).*)",
  ],
};
