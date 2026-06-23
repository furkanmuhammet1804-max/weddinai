// POST /api/mobile/admin/oda/durum — oda durumunu değiştir: aktif/pasif + süre
// uzat. islem: "aktif" | "pasif" | "uzat"; gun: "uzat" için (varsayılan 7).
import { NextResponse } from "next/server";
import { adminBearerGecerli } from "@/lib/mobil/admin-token";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  if (!adminBearerGecerli(request)) {
    return NextResponse.json({ hata: "Yetki yok." }, { status: 401 });
  }

  let body: { id?: string; islem?: string; gun?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ hata: "Geçersiz istek." }, { status: 400 });
  }

  const id = (body.id ?? "").trim();
  const islem = body.islem ?? "";
  if (!id) {
    return NextResponse.json({ hata: "Oda kimliği gerekli." }, { status: 400 });
  }

  const admin = createAdminClient();

  if (islem === "aktif" || islem === "pasif") {
    const { error } = await admin
      .from("events")
      .update({ status: islem === "aktif" ? "aktif" : "arsivlendi" })
      .eq("id", id);
    if (error) {
      return NextResponse.json({ hata: "Durum güncellenemedi." }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  if (islem === "uzat") {
    const gun =
      Number.isFinite(body.gun) && body.gun
        ? Math.min(365, Math.max(1, Math.floor(body.gun)))
        : 7;
    const { data: ev } = await admin
      .from("events")
      .select("expires_at")
      .eq("id", id)
      .maybeSingle();
    const simdi = Date.now();
    const mevcut = ev?.expires_at ? new Date(ev.expires_at as string).getTime() : simdi;
    const taban = Math.max(mevcut, simdi);
    const yeni = new Date(taban + gun * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await admin.from("events").update({ expires_at: yeni }).eq("id", id);
    if (error) {
      return NextResponse.json({ hata: "Süre uzatılamadı." }, { status: 500 });
    }
    return NextResponse.json({ ok: true, expires_at: yeni });
  }

  return NextResponse.json({ hata: "Geçersiz işlem." }, { status: 400 });
}
