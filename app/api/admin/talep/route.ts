// Yönetici bir sipariş talebinin durumunu günceller.
import { NextResponse } from "next/server";
import { adminOturumGecerli } from "@/lib/admin/oturum";
import { createAdminClient } from "@/lib/supabase/admin";

const GECERLI = new Set(["yeni", "iletisim", "odendi", "tamamlandi", "iptal"]);

export async function POST(request: Request) {
  if (!(await adminOturumGecerli())) {
    return NextResponse.json({ hata: "Yetki yok." }, { status: 401 });
  }

  let body: { id?: string; durum?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ hata: "Geçersiz istek." }, { status: 400 });
  }

  const id = (body.id ?? "").trim();
  const durum = (body.durum ?? "").trim();
  if (!id || !GECERLI.has(durum)) {
    return NextResponse.json({ hata: "Eksik/geçersiz parametre." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("talepler").update({ durum }).eq("id", id);
  if (error) {
    return NextResponse.json({ hata: "Güncellenemedi." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
