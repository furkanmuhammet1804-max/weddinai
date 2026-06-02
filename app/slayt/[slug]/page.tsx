import { notFound } from "next/navigation";
import { Slideshow } from "@/components/slideshow/slideshow";
import { slaytVerisi } from "@/lib/oda/veri";

// Canlı slayt — gerçek zamanlı, istek anında.
export const dynamic = "force-dynamic";

export default async function SlaytPage(props: PageProps<"/slayt/[slug]">) {
  const { slug } = await props.params;
  const temiz = typeof slug === "string" ? slug.trim() : "";
  if (!temiz) notFound();

  const veri = await slaytVerisi(temiz);
  if (!veri) notFound();

  return (
    <Slideshow
      baslik={veri.bilgi.title}
      slug={veri.bilgi.slug}
      ilk={veri.fotograflar}
    />
  );
}
