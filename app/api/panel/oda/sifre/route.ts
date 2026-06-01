// Yönetici bir odanın şifresini günceller. (Sahiplik RPC içinde doğrulanır.)
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ hata: "Giriş gerekli." }, { status: 401 });
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
    return NextResponse.json(
      { hata: "Oda şifresi en az 4 karakter olmalı." },
      { status: 400 },
    );
  }

  const { error } = await supabase.rpc("oda_sifre_belirle", {
    p_event_id: id,
    p_password: sifre,
  });
  if (error) {
    return NextResponse.json(
      { hata: "Şifre güncellenemedi (yetki?)." },
      { status: 403 },
    );
  }
  return NextResponse.json({ ok: true });
}
