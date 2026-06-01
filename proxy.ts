// Next.js 16 kök "proxy" (eski adıyla middleware) — her istekte oturumu tazeler
// ve /panel'i girişsiz erişime kapatır. Asıl mantık lib/supabase/middleware.ts'te.
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Statik dosyalar ve resim optimizasyonu hariç tüm yollarda çalış
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
