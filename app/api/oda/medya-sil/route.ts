// Müşteri kendi odasındaki bir veya birden çok medyayı siler
// (DB satırı + depolama dosyası). Oturum çerezi slug'a bağlı doğrulanır.
import { NextResponse } from "next/server";
import { odaOturumOku } from "@/lib/oda/oturum";
import { createAdminClient } from "@/lib/supabase/admin";
import { varyantPath } from "@/lib/medya/veri";

export async function POST(request: Request) {
  let body: { slug?: string; mediaId?: string; mediaIds?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ hata: "Geçersiz istek." }, { status: 400 });
  }

  const slug = (body.slug ?? "").trim();
  // Tekil veya çoklu id desteği.
  const idler = (
    Array.isArray(body.mediaIds) ? body.mediaIds : [body.mediaId]
  )
    .map((x) => (x ?? "").trim())
    .filter(Boolean);

  if (!slug || idler.length === 0) {
    return NextResponse.json({ hata: "Eksik parametre." }, { status: 400 });
  }

  const eventId = await odaOturumOku(slug);
  if (!eventId) {
    return NextResponse.json({ hata: "Oturum geçersiz." }, { status: 401 });
  }

  const admin = createAdminClient();
  // Yalnızca BU odaya ait satırlar (güvenlik).
  const { data: satirlar } = await admin
    .from("media")
    .select("id, storage_path")
    .eq("event_id", eventId)
    .in("id", idler);

  if (!satirlar || satirlar.length === 0) {
    return NextResponse.json({ hata: "İçerik bulunamadı." }, { status: 404 });
  }

  // Orijinal + türevler (thumb/medium) birlikte silinir; aksi halde küçük
  // kopyalar depoda yetim kalır ve imzalı URL ile hâlâ erişilebilir olurdu.
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
    .eq("event_id", eventId)
    .in(
      "id",
      satirlar.map((m) => m.id),
    );
  if (error) {
    return NextResponse.json({ hata: "Silinemedi." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, silinen: satirlar.length });
}
