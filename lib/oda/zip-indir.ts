// =============================================================
// SUNUCU-TARAFI TOPLU İNDİRME — streaming ZIP (fflate, STORE).
//
// Neden sunucu tarafı? İstemci-taraflı JSZip mobilde (özellikle iOS Safari)
// bellek limitine takılıp sekmeyi çökertiyordu. Burada her dosya Storage'tan
// tek tek çekilip ZIP'e akıtılır ve doğrudan yanıta stream edilir:
//   - İstemci belleği KULLANILMAZ (tarayıcı tek dosya indirir).
//   - Sunucu belleği sınırlı: aynı anda ~1 dosya tamponlanır.
//   - İmzalı URL süre dolması derdi YOK (admin client storage_path ile indirir).
//   - STORE (ZipPassThrough): foto/video zaten sıkışık → hızlı, düşük CPU.
//
// fflate kullanılır (saf ESM/TS) → Vercel serverless'te güvenilir bundle/trace.
// Çağıran rota oturumu (oda VEYA admin) ÖNCE doğrular; bu fonksiyon eventId ile
// SINIRLI çalışır.
// =============================================================
import { Zip, ZipPassThrough } from "fflate";
import { createAdminClient } from "@/lib/supabase/admin";

const MEDYA_BUCKET = "event-media";

function temizAd(s: string | null): string {
  return (s ?? "")
    .replace(/[^\p{L}\p{N} _-]/gu, "")
    .trim()
    .slice(0, 30);
}

interface MedyaSatir {
  id: string;
  storage_path: string;
  file_type: string;
  guest_name: string | null;
}

function dosyaAdi(m: MedyaSatir, i: number): string {
  let ext = m.file_type === "video" ? "mp4" : "jpg";
  const dot = m.storage_path.lastIndexOf(".");
  if (dot >= 0) {
    const e = m.storage_path.slice(dot + 1).toLowerCase();
    if (/^[a-z0-9]{2,5}$/.test(e)) ext = e;
  }
  const ad = temizAd(m.guest_name) || "ani";
  return `${String(i + 1).padStart(3, "0")}-${ad}.${ext}`;
}

export async function zipIndirYaniti(
  eventId: string,
  ids: string[] | null,
  zipAdi: string,
): Promise<Response> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("media")
    .select("id, storage_path, file_type, guest_name")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[zip-indir] liste hatası", { eventId, error: error.message });
    return new Response("Liste alınamadı.", { status: 500 });
  }

  let list = (data ?? []).filter(
    (m): m is MedyaSatir => !!(m as MedyaSatir).storage_path,
  );
  if (ids && ids.length) {
    const set = new Set(ids);
    list = list.filter((m) => set.has(m.id));
  }
  if (list.length === 0) {
    return new Response("İndirilecek içerik bulunamadı.", { status: 404 });
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const zip = new Zip((err, chunk, final) => {
        if (err) {
          console.error("[zip-indir] zip hata", err.message);
          try { controller.error(err); } catch { /* zaten kapalı */ }
          return;
        }
        if (chunk && chunk.length) {
          try { controller.enqueue(chunk); } catch { /* iptal edildi */ }
        }
        if (final) {
          try { controller.close(); } catch { /* zaten kapalı */ }
        }
      });

      void (async () => {
        let eklenen = 0;
        const hatalar: string[] = [];
        for (let i = 0; i < list.length; i++) {
          const m = list[i];
          try {
            const { data: blob, error: dErr } = await admin.storage
              .from(MEDYA_BUCKET)
              .download(m.storage_path);
            if (dErr || !blob) {
              hatalar.push(`${m.storage_path}: ${dErr?.message ?? "boş"}`);
              continue;
            }
            const buf = new Uint8Array(await blob.arrayBuffer());
            const entry = new ZipPassThrough(dosyaAdi(m, i)); // STORE
            zip.add(entry);
            entry.push(buf, true); // tek parça + bu giriş bitti
            eklenen++;
          } catch (e) {
            hatalar.push(`${m.storage_path}: ${(e as Error).message}`);
          }
        }
        console.log(
          `[zip-indir] event=${eventId} eklenen=${eklenen}/${list.length} hata=${hatalar.length}`,
        );
        if (hatalar.length)
          console.error("[zip-indir] atlanan (ilk 5):", hatalar.slice(0, 5));
        try { zip.end(); } catch (e) { console.error("[zip-indir] end hata", (e as Error).message); }
      })();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${zipAdi}"`,
      "Cache-Control": "no-store",
    },
  });
}
