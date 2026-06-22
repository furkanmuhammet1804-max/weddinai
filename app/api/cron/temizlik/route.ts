// =============================================================
// OTOMATİK TEMİZLİK — süresi dolmuş odaları kalıcı siler.
// Vercel Cron her gün çağırır (vercel.json). CRON_SECRET ile korunur.
//
// Her oda için:
//   - event-media + event-audio depolama dosyaları silinir
//   - events satırı silinir → media & guestbook cascade ile gider
// =============================================================
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { depoOdaKlasoruSil } from "@/lib/oda/veri";

export const dynamic = "force-dynamic";

function yetkili(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  // Manuel tetikleme için ?key= de kabul edilir.
  const url = new URL(request.url);
  return url.searchParams.get("key") === secret;
}

async function temizle(request: Request) {
  if (!yetkili(request)) {
    return NextResponse.json({ hata: "Yetki yok." }, { status: 401 });
  }

  const admin = createAdminClient();
  const simdi = new Date().toISOString();

  const { data: doldu } = await admin
    .from("events")
    .select("id, slug")
    .lt("expires_at", simdi);

  const odalar = doldu ?? [];
  let silinen = 0;

  for (const oda of odalar) {
    const id = oda.id as string;
    // Depolama temizliği — türevler (thumb/medium) dahil, hepsi silinene dek.
    let depoTamam = true;
    for (const bucket of ["event-media", "event-audio"]) {
      try {
        if (!(await depoOdaKlasoruSil(admin, bucket, id))) depoTamam = false;
      } catch {
        depoTamam = false;
      }
    }
    // DB satırını YALNIZCA depolama tamamen temizlenebildiyse sil.
    // Aksi halde satır kalır → sonraki cron tekrar dener (orphan kalmaz).
    if (!depoTamam) continue;
    const { error } = await admin.from("events").delete().eq("id", id);
    if (!error) silinen += 1;
  }

  return NextResponse.json({ ok: true, bulunan: odalar.length, silinen });
}

export async function GET(request: Request) {
  return temizle(request);
}

export async function POST(request: Request) {
  return temizle(request);
}
