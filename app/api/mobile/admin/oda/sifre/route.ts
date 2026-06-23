// POST /api/mobile/admin/oda/sifre — bir odanın şifresini günceller (RPC).
import { NextResponse } from "next/server";
import { adminBearerGecerli } from "@/lib/mobil/admin-token";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  if (!adminBearerGecerli(request)) {
    return NextResponse.json({ hata: "Yetki yok." }, { status: 401 });
  }

  let body: { id?: string; sifre?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ hata: "Geçersiz istek." }, { status: 400 });
  }

  const id = (body.id ?? "").trim();
  const sifre = body.sifre ?? "";
  if (!id) {
    return NextResponse.json({ hata: "Oda kimliği gerekli." }, { status: 400 });
  }
  if (sifre.length < 4) {
    return NextResponse.json({ hata: "Oda şifresi en az 4 karakter olmalı." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.rpc("oda_sifre_ayarla", {
    p_event_id: id,
    p_password: sifre,
  });
  if (error) {
    return NextResponse.json({ hata: "Şifre güncellenemedi." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
