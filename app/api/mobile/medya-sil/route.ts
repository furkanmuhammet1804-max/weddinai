// POST /api/mobile/medya-sil — müşteri kendi odasındaki bir/birden çok medyayı
// siler (DB satırı + depolama: orijinal + thumb/medium türevleri). Bearer ile
// eventId doğrulanır; yalnızca bu odaya ait satırlar silinir (güvenlik).
import { NextResponse } from "next/server";
import { bearerToken, mobilTokenCoz } from "@/lib/mobil/token";
import { createAdminClient } from "@/lib/supabase/admin";
import { varyantPath } from "@/lib/medya/veri";

export async function POST(request: Request) {
  const oturum = mobilTokenCoz(bearerToken(request));
  if (!oturum) {
    return NextResponse.json({ hata: "Oturum geçersiz." }, { status: 401 });
  }

  let body: { mediaIds?: string[]; mediaId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ hata: "Geçersiz istek." }, { status: 400 });
  }

  const idler = (Array.isArray(body.mediaIds) ? body.mediaIds : [body.mediaId])
    .map((x) => (x ?? "").trim())
    .filter(Boolean);
  if (idler.length === 0) {
    return NextResponse.json({ hata: "Silinecek içerik gerekli." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: satirlar } = await admin
    .from("media")
    .select("id, storage_path")
    .eq("event_id", oturum.eventId)
    .in("id", idler);

  if (!satirlar || satirlar.length === 0) {
    return NextResponse.json({ hata: "İçerik bulunamadı." }, { status: 404 });
  }

  const yollar: string[] = [];
  for (const m of satirlar) {
    const sp = m.storage_path as string;
    if (!sp) continue;
    yollar.push(sp, varyantPath(sp, "thumb"), varyantPath(sp, "medium"));
  }
  if (yollar.length > 0) {
    await admin.storage.from("event-media").remove(yollar);
  }

  const { error } = await admin
    .from("media")
    .delete()
    .eq("event_id", oturum.eventId)
    .in(
      "id",
      satirlar.map((m) => m.id as string),
    );
  if (error) {
    return NextResponse.json({ hata: "Silinemedi." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, silinen: satirlar.length });
}
