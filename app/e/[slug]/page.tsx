import { notFound } from "next/navigation";
import { GuestApp } from "@/components/guest/guest-app";
import { etkinlikler } from "@/lib/mock-data";

export function generateStaticParams() {
  return etkinlikler.map((e) => ({ slug: e.slug }));
}

export default async function GuestPage(props: PageProps<"/e/[slug]">) {
  const { slug } = await props.params;
  const etkinlik = etkinlikler.find((e) => e.slug === slug);

  if (!etkinlik) {
    notFound();
  }

  return <GuestApp etkinlik={etkinlik} />;
}
