import type { Metadata } from "next";
import { SiteNav } from "@/components/site/site-nav";
import { SiteFooter } from "@/components/site/site-footer";
import { DavetiyeTalepForm } from "@/components/davetiye/talep-form";

export const metadata: Metadata = {
  title: "Dijital Davetiye Sipariş Formu — WeddinAI",
  description:
    "Düğün, kına, nişan ve nikahınız için premium dijital davetiye talebinizi oluşturun. Bilgilerinizi doldurun, gerisini biz hallederiz.",
  alternates: { canonical: "/davetiye/talep" },
};

export default function DavetiyeTalepPage() {
  return (
    <>
      <SiteNav />
      <main className="bg-aura">
        <div className="mx-auto max-w-2xl px-5 pb-20 pt-12 sm:px-8 sm:pb-28 sm:pt-20">
          <header className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-primary-deep/70">
              WeddinAI · Dijital Davetiye Atölyesi
            </p>
            <h1 className="font-display mt-5 text-[2.1rem] font-semibold leading-[1.08] tracking-tight sm:text-5xl">
              Davetiyenizi birlikte
              <br className="hidden sm:block" /> tasarlayalım
            </h1>
            <div className="divider-gold mx-auto mt-7 w-24" />
            <p className="mx-auto mt-7 max-w-md text-[15px] leading-relaxed text-muted-foreground">
              Birkaç zarif adımda dilekleriniz bize ulaşsın; gerisini
              tasarım ekibimiz titizlikle hazırlasın. <span className="text-primary-deep">*</span> alanlar zorunludur.
            </p>
          </header>
          <div className="mt-12 sm:mt-14">
            <DavetiyeTalepForm />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
