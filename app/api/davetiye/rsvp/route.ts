// Public RSVP — yayındaki davetiyeye katılım bildirimi.
import { NextResponse } from "next/server";
import { davetiyeGetirSlug, rsvpEkle } from "@/lib/davetiye";
import { rateLimit, istemciIp } from "@/lib/mobil/rate-limit";

export async function POST(request: Request) {
  const ip = istemciIp(request);
  const lim = rateLimit(`davetiye-rsvp:${ip}`, 10, 60_000);
  if (!lim.izin) {
    return NextResponse.json(
      { hata: "Çok fazla istek." },
      { status: 429, headers: { "Retry-After": String(lim.kalanSn) } },
    );
  }

  let b: {
    slug?: string;
    ad?: string;
    katilim?: string;
    kisi_sayisi?: number;
    not?: string;
  };
  try {
    b = await request.json();
  } catch {
    return NextResponse.json({ hata: "Geçersiz istek." }, { status: 400 });
  }

  const slug = (b.slug ?? "").trim();
  const ad = (b.ad ?? "").trim().slice(0, 80);
  const katilim = b.katilim === "evet" ? "evet" : b.katilim === "hayir" ? "hayir" : null;
  if (!slug || !ad || !katilim) {
    return NextResponse.json({ hata: "Lütfen adınızı ve katılım durumunu girin." }, { status: 400 });
  }

  const dav = await davetiyeGetirSlug(slug);
  if (!dav) {
    return NextResponse.json({ hata: "Davetiye bulunamadı." }, { status: 404 });
  }

  const ok = await rsvpEkle(
    dav.id,
    ad,
    katilim,
    Number(b.kisi_sayisi) || 1,
    (b.not ?? "").trim().slice(0, 500) || null,
  );
  if (!ok) {
    return NextResponse.json({ hata: "Kaydedilemedi. Tekrar deneyin." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
