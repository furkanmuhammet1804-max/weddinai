import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { davetiyeGetirSlug, medyaUrl } from "@/lib/davetiye";
import { DavetiyeGoster } from "@/components/davetiye/davetiye-goster";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/davetiye/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const d = await davetiyeGetirSlug(slug);
  if (!d) return { title: "Davetiye bulunamadı — WeddinAI" };
  const kapak = medyaUrl(d.gelin_foto) ?? medyaUrl(d.damat_foto);
  const baslik = `${d.gelin_ad} & ${d.damat_ad} — Davetiye`;
  return {
    title: baslik,
    description: "Sizi özel günümüzde aramızda görmek isteriz. 💛",
    openGraph: {
      title: baslik,
      description: "Sizi özel günümüzde aramızda görmek isteriz.",
      images: kapak ? [kapak] : undefined,
    },
  };
}

export default async function YayinDavetiyePage(
  props: PageProps<"/davetiye/[slug]">,
) {
  const { slug } = await props.params;
  const d = await davetiyeGetirSlug(slug);
  if (!d) notFound();

  return (
    <DavetiyeGoster
      data={{
        slug,
        tema: d.tema ?? null,
        gelin: d.gelin_ad,
        damat: d.damat_ad,
        etkinlikler: Array.isArray(d.etkinlikler) ? d.etkinlikler : [],
        gelinFoto: medyaUrl(d.gelin_foto),
        damatFoto: medyaUrl(d.damat_foto),
        galeri: (d.foto_paths ?? [])
          .map((p) => medyaUrl(p))
          .filter((u): u is string => !!u),
        muzikUrl: medyaUrl(d.muzik_path),
        muzikYoutube: d.muzik_youtube ?? null,
        mesaj: d.mesaj ?? null,
        gelinAile: d.gelin_aile ?? null,
        damatAile: d.damat_aile ?? null,
      }}
    />
  );
}
