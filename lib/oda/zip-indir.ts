// =============================================================
// SUNUCU-TARAFI TOPLU İNDİRME — streaming ZIP (archiver, STORE).
//
// Neden sunucu tarafı? İstemci-taraflı JSZip mobilde (özellikle iOS Safari)
// bellek limitine takılıp sekmeyi çökertiyordu (100+ medya). Burada her dosya
// Storage'tan tek tek çekilip ZIP'e akıtılır ve doğrudan yanıta stream edilir:
//   - İstemci belleği KULLANILMAZ (tarayıcı tek dosya indirir).
//   - Sunucu belleği sınırlı: aynı anda yalnızca 1 dosya tamponlanır + backpressure.
//   - İmzalı URL süre dolması derdi YOK (admin client storage_path ile indirir).
//   - STORE (sıkıştırma yok): foto/video zaten sıkışık → hızlı, düşük CPU.
//
// Çağıran rota oturumu (oda VEYA admin) ÖNCE doğrular; bu fonksiyon eventId ile
// SINIRLI çalışır.
// =============================================================
import { createRequire } from "node:module";
import { Readable } from "node:stream";
import type { Archiver } from "archiver";
import { createAdminClient } from "@/lib/supabase/admin";

// archiver CommonJS → Turbopack ESM interop'unu atlamak için Node'da doğrudan require.
const require = createRequire(import.meta.url);
const archiver = require("archiver") as (
  format: string,
  options?: Record<string, unknown>,
) => Archiver;

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

// Sıra-no + misafir adı + uzantı (istemci dosyaAdi ile aynı mantık).
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
  // Tüm satırları event_id ile çek; (varsa) seçim JS'te filtrelenir →
  // .in() ile büyük id listesinde PostgREST URL limiti sorunundan kaçınırız.
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

  const archive = archiver("zip", { store: true });
  archive.on("error", (e) =>
    console.error("[zip-indir] archive error", e?.message),
  );
  archive.on("warning", (e) => {
    if ((e as { code?: string })?.code !== "ENOENT")
      console.warn("[zip-indir] warning", e?.message);
  });

  // Dosyaları arka planda sırayla ekle; yanıt akışı eşzamanlı stream eder.
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
        archive.append(Buffer.from(await blob.arrayBuffer()), {
          name: dosyaAdi(m, i),
        });
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
    try {
      await archive.finalize();
    } catch (e) {
      console.error("[zip-indir] finalize hata", (e as Error).message);
    }
  })();

  // Node Readable → Web ReadableStream (Next yanıt gövdesi için).
  const web = Readable.toWeb(archive) as unknown as ReadableStream<Uint8Array>;
  return new Response(web, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${zipAdi}"`,
      "Cache-Control": "no-store",
    },
  });
}
