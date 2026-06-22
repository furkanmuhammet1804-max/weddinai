// Talep oluşturulduktan sonra, anon ile public bucket'a yüklenen materyallerin
// storage path'lerini kayda bağlar. (Yalnızca o kayıt; path'ler doğrulanır.)
import { NextResponse } from "next/server";
import { davetiyeMedyaGuncelle } from "@/lib/davetiye";
import { rateLimit, istemciIp } from "@/lib/mobil/rate-limit";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  // Public uç: kötüye kullanımı sınırla (kayıt id'si UUID + IP hız limiti).
  const ip = istemciIp(request);
  const lim = rateLimit(`davetiye-medya:${ip}`, 12, 60_000);
  if (!lim.izin) {
    return NextResponse.json(
      { hata: "Çok fazla istek." },
      { status: 429, headers: { "Retry-After": String(lim.kalanSn) } },
    );
  }

  let b: {
    id?: string;
    gelin_foto?: string;
    damat_foto?: string;
    foto_paths?: string[];
    muzik_path?: string;
  };
  try {
    b = await request.json();
  } catch {
    return NextResponse.json({ hata: "Geçersiz istek." }, { status: 400 });
  }

  const id = (b.id ?? "").trim();
  if (!UUID_RE.test(id))
    return NextResponse.json({ hata: "Geçersiz id." }, { status: 400 });

  // Güvenlik: yalnızca bu kaydın klasörüne ait path'ler kabul edilir.
  const onek = `${id}/`;
  const gecerli = (p?: string) =>
    typeof p === "string" && p.startsWith(onek) ? p : undefined;

  const medya = {
    gelin_foto: gecerli(b.gelin_foto),
    damat_foto: gecerli(b.damat_foto),
    foto_paths: Array.isArray(b.foto_paths)
      ? b.foto_paths.filter((p): p is string => !!gecerli(p)).slice(0, 30)
      : undefined,
    muzik_path: gecerli(b.muzik_path),
  };

  const ok = await davetiyeMedyaGuncelle(id, medya);
  if (!ok) {
    return NextResponse.json({ hata: "Materyaller kaydedilemedi." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
