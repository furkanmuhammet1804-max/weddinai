// Yönetici bir odayı TAMAMEN siler: depolama dosyaları (foto/video + ses) +
// DB kayıtları (event cascade ile media/guestbook). Sahiplik RLS ile doğrulanır.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ hata: "Giriş gerekli." }, { status: 401 });
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

  // Sahiplik: RLS sayesinde yalnızca sahibi bu satırı görebilir.
  const { data: ev } = await supabase
    .from("events")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (!ev) {
    return NextResponse.json(
      { hata: "Oda bulunamadı veya yetkiniz yok." },
      { status: 403 },
    );
  }

  const admin = createAdminClient();

  // Depolama temizliği — her iki bucket'ta da bu odanın klasörü.
  for (const bucket of ["event-media", "event-audio"]) {
    try {
      const { data: objs } = await admin.storage.from(bucket).list(id, {
        limit: 1000,
      });
      if (objs && objs.length > 0) {
        await admin.storage
          .from(bucket)
          .remove(objs.map((o) => `${id}/${o.name}`));
      }
    } catch {
      /* depolama temizliği başarısız olsa da DB silmeye devam */
    }
  }

  // Event'i sil → media & guestbook cascade ile silinir (sahibi RLS).
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ hata: "Oda silinemedi." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
