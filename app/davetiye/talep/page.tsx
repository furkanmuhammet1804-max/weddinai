import type { Metadata } from "next";
import { SiteNav } from "@/components/site/site-nav";
import { SiteFooter } from "@/components/site/site-footer";
import { DavetiyeSiparis } from "@/components/davetiye/davetiye-siparis";

export const metadata: Metadata = {
  title: "Dijital Davetiye Atölyesi — WeddinAI",
  description:
    "Düğün, kına, nişan ve nikahınız için premium dijital davetiyenizi birlikte tasarlayalım. İsimlerinizi yazın, davetiyeniz canlansın; gerisini ekibimiz hazırlasın.",
  alternates: { canonical: "/davetiye/talep" },
};

export default function DavetiyeTalepPage() {
  return (
    <>
      <SiteNav />
      <main>
        <DavetiyeSiparis />
      </main>
      <SiteFooter />
    </>
  );
}
