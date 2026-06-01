// Oturum yenileme yardımcısı — middleware.ts içinden çağrılır
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() oturumu tazeler — çağrılması önemli.
  // Ağ/Supabase hatası isteği çökertmesin; hatada kullanıcı yok kabul edilir.
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    user = null;
  }

  const { pathname } = request.nextUrl;

  // Korumalı alan: /panel girişsiz erişilemez.
  // Giriş sonrası geri dönülebilsin diye hedefi ?next= ile taşı.
  if (!user && pathname.startsWith("/panel")) {
    const url = request.nextUrl.clone();
    url.pathname = "/giris";
    url.searchParams.set("next", pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }

  // Girişli kullanıcı /giris veya /kayit'e gelirse panele yönlendir.
  if (user && (pathname === "/giris" || pathname === "/kayit")) {
    const url = request.nextUrl.clone();
    url.pathname = "/panel";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
