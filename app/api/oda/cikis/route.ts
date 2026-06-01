// Müşteri oda çıkışı: oturum çerezini sil.
import { NextResponse } from "next/server";
import { odaOturumSil } from "@/lib/oda/oturum";

export async function POST() {
  await odaOturumSil();
  return NextResponse.json({ ok: true });
}
