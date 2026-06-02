// Yönetici bir talebin durumunu günceller (authenticated; RLS yetki verir).
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const GECERLI_DURUM = new Set([
  "yeni",
  "iletisim",
  "odendi",
  "tamamlandi",
  "iptal",
]);

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ hata: "Giriş gerekli." }, { status: 401 });
  }

  let body: { id?: string; durum?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ hata: "Geçersiz istek." }, { status: 400 });
  }

  const id = (body.id ?? "").trim();
  const durum = body.durum ?? "";
  if (!id || !GECERLI_DURUM.has(durum)) {
    return NextResponse.json({ hata: "Eksik/geçersiz parametre." }, {
      status: 400,
    });
  }

  const { error } = await supabase
    .from("talepler")
    .update({ durum })
    .eq("id", id);
  if (error) {
    return NextResponse.json({ hata: "Güncellenemedi." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
