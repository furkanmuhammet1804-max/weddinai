// Yönetici toplu indirme — sunucu-taraflı streaming ZIP.
// Admin oturumu doğrulanır; slug → eventId çözümlenir.
import { adminOturumGecerli } from "@/lib/admin/oturum";
import { createAdminClient } from "@/lib/supabase/admin";
import { zipIndirYaniti } from "@/lib/oda/zip-indir";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request): Promise<Response> {
  if (!(await adminOturumGecerli())) {
    return new Response("Yetki yok.", { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return new Response("Geçersiz istek.", { status: 400 });
  }

  const slug = String(form.get("slug") ?? "").trim();
  if (!slug) return new Response("Oda kodu gerekli.", { status: 400 });

  const admin = createAdminClient();
  const { data: ev } = await admin
    .from("events")
    .select("id")
    .ilike("slug", slug)
    .maybeSingle();
  if (!ev?.id) return new Response("Oda bulunamadı.", { status: 404 });

  const idsRaw = String(form.get("ids") ?? "");
  const ids = idsRaw
    ? idsRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : null;

  return zipIndirYaniti(ev.id as string, ids, `${slug}-medya.zip`);
}
