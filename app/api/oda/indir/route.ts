// Müşteri toplu indirme — sunucu-taraflı streaming ZIP.
// Gizli form POST ile çağrılır (iOS Safari dahil her tarayıcıda tek dosya indirir).
import { odaOturumOku } from "@/lib/oda/oturum";
import { zipIndirYaniti } from "@/lib/oda/zip-indir";

export const runtime = "nodejs";
export const maxDuration = 300; // büyük galeriler (plan destekliyorsa)

export async function POST(request: Request): Promise<Response> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return new Response("Geçersiz istek.", { status: 400 });
  }

  const slug = String(form.get("slug") ?? "").trim();
  if (!slug) return new Response("Oda kodu gerekli.", { status: 400 });

  const eventId = await odaOturumOku(slug);
  if (!eventId) return new Response("Oturum geçersiz.", { status: 401 });

  const idsRaw = String(form.get("ids") ?? "");
  const ids = idsRaw
    ? idsRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : null;

  return zipIndirYaniti(eventId, ids, `${slug}-anilar.zip`);
}
