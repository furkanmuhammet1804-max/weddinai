import { notFound } from "next/navigation";
import { Slideshow } from "@/components/slideshow/slideshow";
import { etkinlikler } from "@/lib/mock-data";

export function generateStaticParams() {
  return etkinlikler.map((e) => ({ slug: e.slug }));
}

export default async function SlaytPage(props: PageProps<"/slayt/[slug]">) {
  const { slug } = await props.params;
  const etkinlik = etkinlikler.find((e) => e.slug === slug);

  if (!etkinlik) {
    notFound();
  }

  return <Slideshow baslik={etkinlik.title} />;
}
