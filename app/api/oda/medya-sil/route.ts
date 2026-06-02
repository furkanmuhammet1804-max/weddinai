// Müşteri kendi odasındaki bir medyayı siler (DB satırı + depolama dosyası).
// Oturum çerezi slug'a bağlı doğrulanır → yalnızca kendi odasını siler.
import { NextResponse } from "next/server";
import { odaOturumOku } from "@/lib/oda/oturum";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  let body: { slug?: string; mediaId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ hata: "Geçersiz istek." }, { status: 400 });
  }

  const slug = (body.slug ?? "").trim();
  const mediaId = (body.mediaId ?? "").trim();
  if (!slug || !mediaId) {
    return NextResponse.json({ hata: "Eksik parametre." }, { status: 400 });
  }

  const eventId = await odaOturumOku(slug);
  if (!eventId) {
    return NextResponse.json({ hata: "Oturum geçersiz." }, { status: 401 });
  }

  const admin = createAdminClient();
  // Yalnızca BU odaya ait satır (güvenlik).
  const { data: m } = await admin
    .from("media")
    .select("id, storage_path")
    .eq("id", mediaId)
    .eq("event_id", eventId)
    .maybeSingle();
  if (!m) {
    return NextResponse.json({ hata: "İçerik bulunamadı." }, { status: 404 });
  }

  if (m.storage_path) {
    await admin.storage.from("event-media").remove([m.storage_path as string]);
  }
  const { error } = await admin
    .from("media")
    .delete()
    .eq("id", mediaId)
    .eq("event_id", eventId);
  if (error) {
    return NextResponse.json({ hata: "Silinemedi." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
