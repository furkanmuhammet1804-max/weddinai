// =============================================================
// /album-sec/<token> — Müşteri albüm hazırlama ekranı (PUBLIC, token ile).
// Müşteri KENDİ odasının fotoğraflarından seçer, sıralar, kapak + bölüm belirler.
// Albümü ÜRETME yetkisi yalnız admindedir (admin PDF üretir).
// =============================================================
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { albumSecimGetir } from "@/lib/album/veri";
import { AlbumSecici } from "@/components/album/album-secici";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Albümünüzü Hazırlayın — WeddinAI",
  robots: { index: false, follow: false },
};

export default async function AlbumSecPage(props: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await props.params;
  const veri = await albumSecimGetir(token);
  if (!veri) notFound();

  return <AlbumSecici token={token} veri={veri} />;
}
