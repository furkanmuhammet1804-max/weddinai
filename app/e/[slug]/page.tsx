import { notFound } from "next/navigation";
import { GuestApp } from "@/components/guest/guest-app";
import { etkinlikler } from "@/lib/mock-data";

export function generateStaticParams() {
  // Yalnızca yayında olan (aktif/arşivlenmiş) etkinlikler için statik yol üret;
  // taslaklar herkese açık erişime kapalıdır.
  return etkinlikler
    .filter((e) => e.status !== "taslak")
    .map((e) => ({ slug: e.slug }));
}

export default async function GuestPage(props: PageProps<"/e/[slug]">) {
  const { slug } = await props.params;

  // Slug boş/biçimsizse (örn. trim sonrası boş) doğrudan 404.
  const temizSlug = typeof slug === "string" ? slug.trim() : "";
  if (!temizSlug) {
    notFound();
  }

  const etkinlik = etkinlikler.find((e) => e.slug === temizSlug);

  // Bilinmeyen slug veya henüz yayınlanmamış taslak → 404 (gracefully).
  if (!etkinlik || etkinlik.status === "taslak") {
    notFound();
  }

  // Arşivlenmiş etkinlik var ama yüklemeye kapalı: kapalı durumu göster.
  const kapali = etkinlik.status === "arsivlendi";

  return <GuestApp etkinlik={etkinlik} kapali={kapali} />;
}
