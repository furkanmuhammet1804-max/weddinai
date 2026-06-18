// =============================================================
// PROXY (eski adıyla middleware) yardımcı — admin alanını korur.
//
// Yönetici artık Supabase Auth kullanmıyor; tek admin imzalı bir çerezle
// (admin_oturum) tanınır. Burada Edge'de yalnızca çerezin VARLIĞINI kontrol
// ederiz (hızlı geçiş kapısı). Çerezin imzası ayrıca Node tarafında
// (admin layout + admin API rotaları) tam olarak DOĞRULANIR; bu yüzden
// sahte/kurcalanmış çerez sayfa render'ında ve veri işlemlerinde reddedilir.
// =============================================================
import { NextResponse, type NextRequest } from "next/server";

const ADMIN_COOKIE = "admin_oturum";

export async function updateSession(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // /admin korumalı — yalnızca giriş sayfası ve giriş API'si serbest.
  const adminAlani =
    pathname === "/admin" || pathname.startsWith("/admin/");
  const serbest =
    pathname === "/admin/giris" || pathname.startsWith("/api/admin/giris");

  if (adminAlani && !serbest) {
    const cerezVar = !!request.cookies.get(ADMIN_COOKIE)?.value;
    if (!cerezVar) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/giris";
      url.search = "";
      if (pathname !== "/admin") {
        url.searchParams.set("next", pathname + search);
      }
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next({ request });
}
