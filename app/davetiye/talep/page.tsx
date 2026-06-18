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
      <main className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="mb-8 text-center">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary-soft/50 px-3 py-1 text-xs font-medium text-primary-deep">
            Dijital Davetiye
          </p>
          <h1 className="font-display mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Dijital Davetiye Sipariş Formu
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Dijital davetiyenizin hazırlanabilmesi için aşağıdaki bilgileri
            eksiksiz doldurunuz. Yıldızlı (*) alanlar zorunludur.
          </p>
        </div>
        <DavetiyeTalepForm />
      </main>
      <SiteFooter />
    </>
  );
}
