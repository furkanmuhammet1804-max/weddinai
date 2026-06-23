// /api/mobile/push/kayit
//   POST   → Expo push token kaydet/güncelle (odaya bağlı, rol=musteri)
//   DELETE → token sil (çıkış/iptal)
// Bearer ile eventId doğrulanır.
import { NextResponse } from "next/server";
import { bearerToken, mobilTokenCoz } from "@/lib/mobil/token";
import { pushTokenKaydet, pushTokenSil } from "@/lib/push/veri";

export async function POST(request: Request) {
  const oturum = mobilTokenCoz(bearerToken(request));
  if (!oturum) {
    return NextResponse.json({ hata: "Oturum geçersiz." }, { status: 401 });
  }

  let body: { token?: string; platform?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ hata: "Geçersiz istek." }, { status: 400 });
  }

  const pushToken = (body.token ?? "").trim();
  if (!pushToken) {
    return NextResponse.json({ hata: "Push token gerekli." }, { status: 400 });
  }

  const ok = await pushTokenKaydet(pushToken, oturum.eventId, body.platform ?? "unknown", "musteri");
  if (!ok) return NextResponse.json({ hata: "Kaydedilemedi." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const oturum = mobilTokenCoz(bearerToken(request));
  if (!oturum) {
    return NextResponse.json({ hata: "Oturum geçersiz." }, { status: 401 });
  }

  let body: { token?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ hata: "Geçersiz istek." }, { status: 400 });
  }

  const pushToken = (body.token ?? "").trim();
  if (!pushToken) {
    return NextResponse.json({ hata: "Push token gerekli." }, { status: 400 });
  }

  const ok = await pushTokenSil(pushToken);
  if (!ok) return NextResponse.json({ hata: "Silinemedi." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
