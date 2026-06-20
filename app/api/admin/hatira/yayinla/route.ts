// POST /api/admin/hatira/yayinla — defteri yayınlar/taslağa alır (§7 admin-only).
// Yayınlarken slug atanır. Otomatik yayın YOK; bu işlem yalnız admin'in
// açık eylemiyle gerçekleşir.
import { NextResponse } from "next/server";
import { adminOturumGecerli } from "@/lib/admin/oturum";
import { hatiraYayinlaSema } from "@/lib/hatira/sema";
import { hatiraYayinla } from "@/lib/hatira/veri";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await adminOturumGecerli())) {
    return NextResponse.json({ ok: false, hata: "Yetki yok." }, { status: 401 });
  }

  let ham: unknown;
  try {
    ham = await request.json();
  } catch {
    return NextResponse.json({ ok: false, hata: "Geçersiz istek." }, { status: 400 });
  }
  const ayris = hatiraYayinlaSema.safeParse(ham);
  if (!ayris.success) {
    return NextResponse.json({ ok: false, hata: "Eksik/hatalı alan." }, { status: 400 });
  }
  const { id, yayinla } = ayris.data;

  const sonuc = await hatiraYayinla(id, yayinla);
  if (!sonuc.ok) {
    return NextResponse.json({ ok: false, hata: "Güncellenemedi." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, slug: sonuc.slug ?? null });
}
