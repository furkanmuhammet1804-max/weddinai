// Yönetici çıkışı: oturum çerezini sil.
import { NextResponse } from "next/server";
import { adminOturumSil } from "@/lib/admin/oturum";

export async function POST() {
  await adminOturumSil();
  return NextResponse.json({ ok: true });
}
