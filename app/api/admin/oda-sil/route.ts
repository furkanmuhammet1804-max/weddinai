// Yönetici bir odayı TAMAMEN siler: depolama dosyaları + DB (cascade).
import { NextResponse } from "next/server";
import { adminOturumGecerli } from "@/lib/admin/oturum";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  if (!(await adminOturumGecerli())) {
    return NextResponse.json({ hata: "Yetki yok." }, { status: 401 });
  }

  let body: { id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ hata: "Geçersiz istek." }, { status: 400 });
  }
  const id = (body.id ?? "").trim();
  if (!id) {
    return NextResponse.json({ hata: "Oda kimliği gerekli." }, { status: 400 });
  }

  const admin = createAdminClient();

  // Depolama temizliği — her iki bucket'ta da bu odanın klasörü.
  for (const bucket of ["event-media", "event-audio"]) {
    try {
      const { data: objs } = await admin.storage
        .from(bucket)
        .list(id, { limit: 1000 });
      if (objs && objs.length > 0) {
        await admin.storage
          .from(bucket)
          .remove(objs.map((o) => `${id}/${o.name}`));
      }
    } catch {
      /* depolama temizliği başarısız olsa da DB silmeye devam */
    }
  }

  const { error } = await admin.from("events").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ hata: "Oda silinemedi." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
